"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";
import { uploadReceiptImage } from "./storage";

export type EnqueueReceiptScanJobState = {
  jobId: string | null;
  error: string | null;
};

async function getOwnJobSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  jobId: string,
) {
  try {
    const { data, error } = await supabase
      .from("receipt_scan_jobs")
      .select("status,error_message")
      .eq("id", jobId)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as { status?: unknown; error_message?: unknown };
    return {
      status: typeof row.status === "string" ? row.status : null,
      errorMessage:
        typeof row.error_message === "string" ? row.error_message : null,
    };
  } catch {
    return null;
  }
}

function formatWorkerFailure(
  jobId: string,
  payload: unknown,
  fallbackMessage: string,
) {
  if (payload && typeof payload === "object") {
    const stage = (payload as Record<string, unknown>).stage;
    const err = (payload as Record<string, unknown>).error;
    const msg = (payload as Record<string, unknown>).message;
    const stageText = typeof stage === "string" ? ` stage=${stage}` : "";
    const detail =
      typeof err === "string" ? err : typeof msg === "string" ? msg : null;
    return {
      jobId,
      error: `Queued, but worker failed:${stageText}${detail ? `: ${detail}` : ""}`,
    };
  }

  return {
    jobId,
    error: `Queued, but worker failed: ${fallbackMessage}`,
  };
}

async function tryParseInvokeThrownBody(thrown: unknown) {
  try {
    const anyErr = thrown as { context?: unknown };
    const ctx = anyErr?.context;

    // `supabase-js` attaches a Response-like object at `error.context`.
    // In some runtimes it may not be an instance of the global Response,
    // so we duck-type it.
    if (!ctx || typeof ctx !== "object") return null;
    const maybeRes = ctx as { text?: unknown; json?: unknown };
    const hasText = typeof maybeRes.text === "function";
    const hasJson = typeof maybeRes.json === "function";
    if (!hasText && !hasJson) return null;

    const text = hasText
      ? await (maybeRes.text as () => Promise<string>)().catch(() => "")
      : "";
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: text.slice(0, 300) };
    }
  } catch {
    return null;
  }
}

async function tryGetInvokeErrorBody(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  jobId: string,
) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!baseUrl || !anonKey || !accessToken) return null;

    const res = await fetch(`${baseUrl}/functions/v1/process-receipt-jobs`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ jobId }),
    });

    const text = await res.text().catch(() => "");
    if (!text) return null;

    try {
      const json = JSON.parse(text) as unknown;
      return { status: res.status, json };
    } catch {
      return { status: res.status, text };
    }
  } catch {
    return null;
  }
}

export async function enqueueReceiptScanJobFromFormData(
  formData: FormData,
): Promise<EnqueueReceiptScanJobState> {
  const { imagePath, error } = await uploadReceiptImage(formData);

  if (error || !imagePath) {
    return { jobId: null, error: error ?? "Upload failed" };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { jobId: null, error: "User not authenticated" };
  }

  const jobId = crypto.randomUUID();

  const { error: insertError } = await supabase
    .from("receipt_scan_jobs")
    .insert({
      id: jobId,
      user_id: user.id,
      status: "queued",
      image_path: imagePath,
    });

  if (insertError) {
    return {
      jobId: null,
      error: insertError?.message ?? "Failed to queue job",
    };
  }

  // Best-effort: kick the worker so jobs progress even without a schedule.
  // If this fails (e.g. function not deployed), the job will remain queued
  // until a scheduled run processes it.
  let invokeData: unknown = null;
  try {
    const result = await supabase.functions.invoke("process-receipt-jobs", {
      body: { jobId },
    });
    invokeData = result.data as unknown;

    // Some supabase-js versions return { error } instead of throwing.
    if (result.error) {
      const summary = await getOwnJobSummary(supabase, jobId);
      if (summary?.status === "error" || summary?.status === "done") {
        // Worker ran; let the job page show errorMessage/receiptId.
        return { jobId, error: null };
      }

      const body = await tryGetInvokeErrorBody(supabase, jobId);
      console.warn("Failed to invoke process-receipt-jobs", result.error);

      if (body?.json) {
        return formatWorkerFailure(jobId, body.json, result.error.message);
      }
      if (body?.text) {
        const snippet = body.text.slice(0, 300);
        return {
          jobId,
          error: `Queued, but worker failed: ${result.error.message} (body: ${snippet})`,
        };
      }
      return {
        jobId,
        error: `Queued, but worker failed: ${result.error.message}${summary?.errorMessage ? `: ${summary.errorMessage}` : ""}`,
      };
    }
  } catch (thrown) {
    const thrownBody = await tryParseInvokeThrownBody(thrown);
    const body =
      thrownBody ?? (await tryGetInvokeErrorBody(supabase, jobId))?.json;
    console.warn("Failed to invoke process-receipt-jobs", thrown);
    const summary = await getOwnJobSummary(supabase, jobId);
    if (summary?.status === "error" || summary?.status === "done") {
      return { jobId, error: null };
    }

    if (summary?.errorMessage) {
      return {
        jobId,
        error: `Queued, but worker failed: ${summary.errorMessage}`,
      };
    }

    return formatWorkerFailure(jobId, body, "Edge Function returned non-2xx");
  }

  if (invokeData && typeof invokeData === "object" && invokeData !== null) {
    const ok = (invokeData as Record<string, unknown>).ok;
    if (ok === false) {
      const summary = await getOwnJobSummary(supabase, jobId);
      if (summary?.status === "error" || summary?.status === "done") {
        return { jobId, error: null };
      }
      if (summary?.errorMessage) {
        return {
          jobId,
          error: `Queued, but worker failed: ${summary.errorMessage}`,
        };
      }
      return formatWorkerFailure(jobId, invokeData, "Worker returned ok:false");
    }
  }

  return { jobId, error: null };
}

export async function enqueueReceiptScanJobAction(
  _prevState: EnqueueReceiptScanJobState,
  formData: FormData,
): Promise<EnqueueReceiptScanJobState> {
  return enqueueReceiptScanJobFromFormData(formData);
}
