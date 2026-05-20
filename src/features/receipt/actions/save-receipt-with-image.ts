"use server";

import { saveReceipt } from "../services/save-receipt";
import type { ReceiptProps } from "../types";
import { uploadReceiptImage } from "./storage";

export type SaveReceiptWithImageResult = {
  receiptId: string | null;
  signedUrl: string | null;
  error: string | null;
};

export async function saveReceiptWithImage(
  receipt: ReceiptProps,
  formData: FormData,
): Promise<SaveReceiptWithImageResult> {
  const { imagePath, signedUrl, error } = await uploadReceiptImage(formData);

  if (error || !imagePath) {
    return {
      receiptId: null,
      signedUrl: null,
      error: error ?? "Upload failed",
    };
  }

  const receiptId = await saveReceipt(receipt, imagePath);

  return { receiptId, signedUrl, error: null };
}
