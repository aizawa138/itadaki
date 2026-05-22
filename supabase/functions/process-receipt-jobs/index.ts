// Supabase Edge Function: process-receipt-jobs
//
// NOTE: This implementation intentionally avoids external module imports.
// Remote ESM imports can fail in the Edge runtime and surface as
// EDGE_FUNCTION_ERROR (500) before the handler runs, preventing useful JSON
// diagnostics. Using only built-in APIs keeps the function debuggable.
//
// - Picks one queued job (or a specific jobId)
// - Downloads the image from Storage (private bucket)
// - Calls Gemini to extract JSON
// - Inserts into receipts + receipt_items + pantry_items
// - Marks job done/error
//
// Deploy:
//   supabase functions deploy process-receipt-jobs
// Secrets required:
//   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GEMINI_API_KEY=...
// Optional:
//   supabase secrets set DEBUG=1

import { syncReceiptItemsToPantry } from "../_shared/sync-receipt-to-pantry.ts";

const RECEIPT_BUCKET = "receipts";
const MODEL = "gemini-2.5-flash";

type WorkerRequestBody = { jobId?: string };

type ReceiptScanJob = {
  id: string;
  user_id: string;
  image_path: string;
  attempt_count: number | null;
};

type ClaimedJob = {
  id: string;
  user_id: string;
  image_path: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

const RECEIPT_PARSE_PROMPT = `Analyze this grocery receipt image.

Extract structured receipt data matching the exact JSON schema below.

STRICT RULES:

1. Return valid JSON only
2. Do not wrap output in markdown
3. Do not include explanations
4. Use null when data is not visible or uncertain
5. confidence_score must be between 0 and 1
6. Monetary values must be numbers only
7. Parse timestamps as ISO 8601 when possible

RECEIPT RULES

- Extract store name
- Extract total amount
- Detect currency if possible
- Extract purchase timestamp
- Set ocr_status:
  "success"
  "partial"
  "failed"

ITEM RULES

Extract grocery-related purchased items.

Ignore:
- tax
- subtotal
- total summary rows
- discounts
- loyalty adjustments
- payment method rows
- receipt metadata lines

For each item:

raw_name:
Exact text appearing on receipt

normalized_name:
Human-readable ingredient/product name

quantity:
Infer only if explicit

unit:
Examples:
kg
g
L
mL
pack
bottle
can

unit_price:
Single-item price if visible

total_price:
Final line-item price

JSON SCHEMA:

{
  "receipt": {
    "store_name": string | null,
    "total_amount": number | null,
    "currency": string | null,
    "purchased_at": string | null,
    "ocr_status": "success" | "partial" | "failed"
  },
  "receipt_items": [
    {
      "raw_name": string,
      "normalized_name": string,
      "quantity": number | null,
      "unit": string | null,
      "unit_price": number | null,
      "total_price": number | null,
      "confidence_score": number
    }
  ]
}

Only return JSON.`;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getEnv(name: string): string {
  return (Deno.env.get(name) ?? "").trim();
}

function compactDetails(details: unknown, maxLen = 300): string | null {
  if (details == null) return null;
  if (typeof details === "string") return details.slice(0, maxLen);
  try {
    return JSON.stringify(details).slice(0, maxLen);
  } catch {
    return null;
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeModelOutput(modelOutput: unknown) {
  const obj = modelOutput as Record<string, unknown>;
  const receiptRaw = (obj?.receipt ?? {}) as Record<string, unknown>;
  const itemsRaw = obj?.receipt_items;

  const receipt = {
    store_name: asStringOrNull(receiptRaw.store_name),
    total_amount: asNumberOrNull(receiptRaw.total_amount),
    currency: asStringOrNull(receiptRaw.currency),
    purchased_at: asStringOrNull(receiptRaw.purchased_at),
    ocr_status: asStringOrNull(receiptRaw.ocr_status),
    ocr_raw_text: null,
  };

  const receipt_items = Array.isArray(itemsRaw)
    ? itemsRaw
        .filter((x) => typeof x === "object" && x !== null && !Array.isArray(x))
        .map((item) => {
          const it = item as Record<string, unknown>;
          return {
            raw_name: asStringOrNull(it.raw_name),
            normalized_name: asStringOrNull(it.normalized_name),
            quantity: asNumberOrNull(it.quantity),
            unit: asStringOrNull(it.unit),
            unit_price: asNumberOrNull(it.unit_price),
            total_price: asNumberOrNull(it.total_price),
            confidence_score: asNumberOrNull(it.confidence_score),
          };
        })
    : [];

  return { receipt, receipt_items };
}

function supabaseHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
  };
}

async function restFetch(
  url: string,
  serviceRoleKey: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const auth = supabaseHeaders(serviceRoleKey);
  headers.set("apikey", auth.apikey);
  headers.set("authorization", auth.authorization);
  headers.set("accept", "application/json");
  return await fetch(url, { ...init, headers });
}

async function restJsonOrText(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function storageDownload(
  supabaseUrl: string,
  serviceRoleKey: string,
  bucket: string,
  path: string,
) {
  const encodedPath = path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;
  return await restFetch(url, serviceRoleKey, { method: "GET" });
}

async function markJobStatus(
  supabaseUrl: string,
  serviceRoleKey: string,
  jobId: string,
  status: "error" | "done",
  fields: Record<string, unknown>,
) {
  const url = new URL(`${supabaseUrl}/rest/v1/receipt_scan_jobs`);
  url.searchParams.set("id", `eq.${jobId}`);
  await restFetch(url.toString(), serviceRoleKey, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({ status, ...fields }),
  });
}

Deno.serve(async (req) => {
  const debug = getEnv("DEBUG") === "1";

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = getEnv("GEMINI_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          ok: false,
          stage: "env",
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        },
        500,
      );
    }

    if (serviceRoleKey.startsWith("sb_publishable_")) {
      return jsonResponse(
        {
          ok: false,
          stage: "env",
          error:
            "SUPABASE_SERVICE_ROLE_KEY looks like a publishable key (sb_publishable_*). Use the secret service role key (sb_secret_*).",
        },
        500,
      );
    }

    if (!geminiKey) {
      return jsonResponse(
        { ok: false, stage: "env", error: "Missing GEMINI_API_KEY" },
        500,
      );
    }

    // Parse request body (optional): { jobId }
    let requestedJobId: string | null = null;
    try {
      const ct = req.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const body = (await req
          .json()
          .catch(() => null)) as WorkerRequestBody | null;
        if (body?.jobId && typeof body.jobId === "string")
          requestedJobId = body.jobId;
      }
    } catch {
      // ignore body parse issues
    }

    // Select one queued job (or a specific jobId)
    // If jobId is provided, fetch it regardless of status first, so we can
    // report the current status (helps debug races).
    const selectUrl = new URL(`${supabaseUrl}/rest/v1/receipt_scan_jobs`);
    selectUrl.searchParams.set(
      "select",
      "id,user_id,image_path,attempt_count,status,error_message,receipt_id",
    );
    if (requestedJobId) {
      selectUrl.searchParams.set("id", `eq.${requestedJobId}`);
      selectUrl.searchParams.set("limit", "1");
    } else {
      selectUrl.searchParams.set("status", "eq.queued");
      selectUrl.searchParams.set("order", "created_at.asc");
      selectUrl.searchParams.set("limit", "1");
    }

    const selectRes = await restFetch(selectUrl.toString(), serviceRoleKey, {
      method: "GET",
    });
    if (!selectRes.ok) {
      const body = await restJsonOrText(selectRes);
      const bodySnippet = compactDetails(body);
      return jsonResponse(
        {
          ok: false,
          stage: "job_select",
          error: `Job select failed (${selectRes.status})${bodySnippet ? `: ${bodySnippet}` : ""}`,
          details: debug ? body : undefined,
        },
        500,
      );
    }

    const jobs = (await selectRes.json().catch(() => [])) as Array<
      ReceiptScanJob & {
        status?: unknown;
        error_message?: unknown;
        receipt_id?: unknown;
      }
    >;
    const job = Array.isArray(jobs) ? jobs[0] : null;

    if (!job) {
      if (requestedJobId) {
        return jsonResponse(
          {
            ok: false,
            stage: "job_select",
            error: "Requested job not found",
          },
          404,
        );
      }
      return jsonResponse(
        { ok: true, stage: "idle", message: "No queued jobs" },
        200,
      );
    }

    if (requestedJobId) {
      const status = asString(job.status);
      if (status && status !== "queued") {
        const errorMessage = asString(job.error_message);
        const receiptId = asString(job.receipt_id);
        return jsonResponse(
          {
            ok: false,
            stage: "job_select",
            error: `Requested job is not queued (status=${status})${errorMessage ? `: ${errorMessage}` : ""}`,
            receiptId,
          },
          409,
        );
      }
    }

    // Claim job (transition queued -> processing)
    const claimUrl = new URL(`${supabaseUrl}/rest/v1/receipt_scan_jobs`);
    claimUrl.searchParams.set("id", `eq.${job.id}`);
    claimUrl.searchParams.set("status", "eq.queued");

    const claimRes = await restFetch(claimUrl.toString(), serviceRoleKey, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "processing",
        attempt_count: (job.attempt_count ?? 0) + 1,
      }),
    });

    if (!claimRes.ok) {
      const body = await restJsonOrText(claimRes);
      const bodySnippet = compactDetails(body);
      return jsonResponse(
        {
          ok: false,
          stage: "job_claim",
          error: `Job claim failed (${claimRes.status})${bodySnippet ? `: ${bodySnippet}` : ""}`,
          details: debug ? body : undefined,
        },
        500,
      );
    }

    const claimedArr = (await claimRes.json().catch(() => [])) as ClaimedJob[];
    const claimed = Array.isArray(claimedArr) ? claimedArr[0] : null;

    if (!claimed) {
      return jsonResponse(
        { ok: true, stage: "job_claim", message: "Job already claimed" },
        200,
      );
    }

    try {
      // Download image from private bucket
      const downloadRes = await storageDownload(
        supabaseUrl,
        serviceRoleKey,
        RECEIPT_BUCKET,
        claimed.image_path,
      );

      if (!downloadRes.ok) {
        const body = await restJsonOrText(downloadRes);
        const bodySnippet = compactDetails(body);
        throw new Error(
          `Failed to download image (${downloadRes.status})${bodySnippet ? `: ${bodySnippet}` : ""}`,
        );
      }

      const bytes = new Uint8Array(await downloadRes.arrayBuffer());
      const base64 = uint8ToBase64(bytes);

      // Gemini generateContent
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    // Storage doesn't preserve original mime type. Assume jpeg.
                    mimeType: "image/jpeg",
                    data: base64,
                  },
                },
                { text: RECEIPT_PARSE_PROMPT },
              ],
            },
          ],
        }),
      });

      const geminiJson = (await geminiRes
        .json()
        .catch(() => null)) as GeminiGenerateContentResponse | null;

      if (!geminiRes.ok) {
        const message =
          geminiJson?.error?.message ??
          `Gemini request failed (${geminiRes.status})`;
        throw new Error(message);
      }

      const text =
        geminiJson?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("") ?? "";

      const parsed = JSON.parse(text.trim());
      const normalized = normalizeModelOutput(parsed);

      const receiptId = crypto.randomUUID();

      // Insert receipt
      const receiptInsertRes = await restFetch(
        `${supabaseUrl}/rest/v1/receipts`,
        serviceRoleKey,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            prefer: "return=minimal",
          },
          body: JSON.stringify({
            id: receiptId,
            user_id: claimed.user_id,
            image_url: claimed.image_path,
            store_name: normalized.receipt.store_name,
            total_amount: normalized.receipt.total_amount,
            currency: normalized.receipt.currency,
            purchased_at: normalized.receipt.purchased_at,
            ocr_status: normalized.receipt.ocr_status,
            ocr_raw_text: normalized.receipt.ocr_raw_text,
          }),
        },
      );

      if (!receiptInsertRes.ok) {
        const body = await restJsonOrText(receiptInsertRes);
        const bodySnippet = compactDetails(body);
        throw new Error(
          `Failed to insert receipt (${receiptInsertRes.status})${bodySnippet ? `: ${bodySnippet}` : ""}`,
        );
      }

      // Insert items and sync to pantry
      if (normalized.receipt_items.length > 0) {
        const itemsForPantry: Array<{
          id: string;
          normalized_name: string | null;
          quantity: number | null;
          unit: string | null;
        }> = [];

        const items = normalized.receipt_items.map((it) => {
          const id = crypto.randomUUID();
          itemsForPantry.push({
            id,
            normalized_name: it.normalized_name,
            quantity: it.quantity,
            unit: it.unit,
          });
          return {
            id,
            receipt_id: receiptId,
            raw_name: it.raw_name,
            normalized_name: it.normalized_name,
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unit_price,
            total_price: it.total_price,
            confidence_score: it.confidence_score,
          };
        });

        const itemsInsertRes = await restFetch(
          `${supabaseUrl}/rest/v1/receipt_items`,
          serviceRoleKey,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              prefer: "return=minimal",
            },
            body: JSON.stringify(items),
          },
        );

        if (!itemsInsertRes.ok) {
          const body = await restJsonOrText(itemsInsertRes);
          const bodySnippet = compactDetails(body);
          throw new Error(
            `Failed to insert receipt items (${itemsInsertRes.status})${bodySnippet ? `: ${bodySnippet}` : ""}`,
          );
        }

        await syncReceiptItemsToPantry(
          (url, init) => restFetch(url, serviceRoleKey, init),
          supabaseUrl,
          claimed.user_id,
          itemsForPantry,
        );
      }

      await markJobStatus(supabaseUrl, serviceRoleKey, claimed.id, "done", {
        receipt_id: receiptId,
        error_message: null,
      });

      return jsonResponse({ ok: true, jobId: claimed.id, receiptId }, 200);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Job failed");
      const message = err.message || "Job failed";

      console.error(
        JSON.stringify({
          stage: "run",
          error: message,
          stack: debug ? err.stack : undefined,
          jobId: claimed.id,
        }),
      );

      try {
        await markJobStatus(supabaseUrl, serviceRoleKey, claimed.id, "error", {
          error_message: message,
        });
      } catch (updateErr) {
        const uerr =
          updateErr instanceof Error
            ? updateErr
            : new Error("Failed to update job error status");
        console.error(
          JSON.stringify({
            stage: "job_mark_error",
            error: uerr.message,
            stack: debug ? uerr.stack : undefined,
            jobId: claimed.id,
          }),
        );
      }

      return jsonResponse(
        {
          ok: false,
          stage: "run",
          error: message,
          stack: debug ? err.stack : undefined,
          jobId: claimed.id,
        },
        500,
      );
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Fatal error");
    console.error(
      JSON.stringify({
        stage: "fatal",
        error: err.message,
        stack: debug ? err.stack : undefined,
      }),
    );
    return jsonResponse(
      {
        ok: false,
        stage: "fatal",
        error: err.message,
        stack: debug ? err.stack : undefined,
      },
      500,
    );
  }
});
