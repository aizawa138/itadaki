"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";

const RECEIPT_BUCKET = "receipts";
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24;

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
  const imagePath = `receipts/${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(imagePath, file, { contentType: file.type });

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
