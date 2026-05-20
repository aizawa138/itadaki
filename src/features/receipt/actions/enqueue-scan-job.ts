"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";
import { uploadReceiptImage } from "./storage";

export type EnqueueReceiptScanJobState = {
  jobId: string | null;
  error: string | null;
};

export async function enqueueReceiptScanJobAction(
  _prevState: EnqueueReceiptScanJobState,
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

  return { jobId, error: null };
}
