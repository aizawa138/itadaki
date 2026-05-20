"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";

const RECEIPT_BUCKET = "receipts";
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24;

const MAX_RECEIPT_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type UploadReceiptImageResult = {
  imagePath: string | null;
  signedUrl: string | null;
  error: string | null;
};

export async function uploadReceiptImage(
  formData: FormData,
): Promise<UploadReceiptImageResult> {
  const file = formData.get("receipt") as File | null;

  if (!file) {
    return { imagePath: null, signedUrl: null, error: "No file uploaded" };
  }

  if (!ALLOWED_RECEIPT_IMAGE_MIME_TYPES.has(file.type)) {
    return {
      imagePath: null,
      signedUrl: null,
      error: "Unsupported file type",
    };
  }

  if (file.size > MAX_RECEIPT_IMAGE_BYTES) {
    return {
      imagePath: null,
      signedUrl: null,
      error: "File must be 5MB or smaller",
    };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      imagePath: null,
      signedUrl: null,
      error: "User not authenticated",
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  // Keep object key as `<uid>/<file>` so Storage RLS policies are simple.
  const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(imagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { imagePath: null, signedUrl: null, error: uploadError.message };
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(imagePath, SIGNED_URL_EXPIRES_IN);

  if (signedError) {
    return { imagePath: null, signedUrl: null, error: signedError.message };
  }

  return {
    imagePath,
    signedUrl: signedData.signedUrl,
    error: null,
  };
}
