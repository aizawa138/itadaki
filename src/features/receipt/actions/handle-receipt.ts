"use server";

import { scanReceipt } from "../services/scan-receipt";
import type { HandleReceiptState } from "../types";
import { normalizeModelOutputToReceiptProps } from "../utils/normalize-model-output";
import { saveReceiptWithImage } from "./save-receipt-with-image";

export async function handleReceiptAction(
  _prevState: HandleReceiptState,
  formData: FormData,
): Promise<HandleReceiptState> {
  const scanned = await scanReceipt(formData);

  if ("error" in scanned && scanned.error) {
    return { receiptId: null, signedUrl: null, error: scanned.error };
  }

  try {
    const receiptProps = normalizeModelOutputToReceiptProps(
      (scanned as { result: unknown }).result,
    );

    return await saveReceiptWithImage(receiptProps, formData);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to handle receipt";
    return { receiptId: null, signedUrl: null, error: message };
  }
}
