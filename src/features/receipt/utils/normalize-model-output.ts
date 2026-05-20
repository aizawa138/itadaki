import type { ReceiptProps } from "../types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeModelOutputToReceiptProps(
  modelOutput: unknown,
): ReceiptProps {
  if (!isObject(modelOutput)) {
    throw new Error("Invalid model output");
  }

  const receiptRaw = modelOutput.receipt;
  const itemsRaw = modelOutput.receipt_items;

  if (!isObject(receiptRaw)) {
    throw new Error("Invalid receipt payload");
  }

  const receipt: ReceiptProps["receipt"] = {
    store_name: asStringOrNull(receiptRaw.store_name),
    total_amount: asNumberOrNull(receiptRaw.total_amount),
    currency: asStringOrNull(receiptRaw.currency),
    purchased_at: asStringOrNull(receiptRaw.purchased_at),
    ocr_status: asStringOrNull(receiptRaw.ocr_status),
    ocr_raw_text: asStringOrNull(receiptRaw.ocr_raw_text),
  };

  const receipt_items: ReceiptProps["receipt_items"] = Array.isArray(itemsRaw)
    ? itemsRaw.filter(isObject).map((item) => ({
        raw_name: asStringOrNull(item.raw_name),
        normalized_name: asStringOrNull(item.normalized_name),
        quantity: asNumberOrNull(item.quantity),
        unit: asStringOrNull(item.unit),
        unit_price: asNumberOrNull(item.unit_price),
        total_price: asNumberOrNull(item.total_price),
        confidence_score: asNumberOrNull(item.confidence_score),
      }))
    : [];

  return { receipt, receipt_items };
}
