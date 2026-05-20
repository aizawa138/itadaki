import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";
import { NextResponse } from "next/server";

const RECEIPT_BUCKET = "receipts";
const SIGNED_URL_EXPIRES_IN = 60 * 60;

export async function GET(
  _req: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from("receipt_scan_jobs")
    .select("id,status,receipt_id,error_message,image_path,updated_at")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let signedUrl: string | null = null;
  if (job.image_path) {
    const { data: signedData } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .createSignedUrl(job.image_path, SIGNED_URL_EXPIRES_IN);

    signedUrl = signedData?.signedUrl ?? null;
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    receiptId: job.receipt_id,
    errorMessage: job.error_message,
    signedUrl,
    updatedAt: job.updated_at,
  });
}
