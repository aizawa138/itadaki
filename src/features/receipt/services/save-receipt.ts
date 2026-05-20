"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";
import type { ReceiptItemInsert, ReceiptInsert, ReceiptProps } from "../types";

export async function saveReceipt(receipt: ReceiptProps, imagePath: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const receiptId = crypto.randomUUID();

  const receiptInsert: ReceiptInsert = {
    ...receipt.receipt,
    id: receiptId,
    user_id: user.id,
    image_url: imagePath,
  };

  const { error: receiptError } = await supabase
    .from("receipts")
    .insert(receiptInsert);

  if (receiptError) {
    throw new Error(receiptError.message ?? "Failed to save receipt");
  }

  if (receipt.receipt_items.length > 0) {
    const receiptItemsInsert: ReceiptItemInsert[] = receipt.receipt_items.map(
      (item) => ({
        ...item,
        receipt_id: receiptId,
      }),
    );

    const { error: receiptItemError } = await supabase
      .from("receipt_items")
      .insert(receiptItemsInsert);

    if (receiptItemError) {
      throw new Error(
        receiptItemError.message ?? "Failed to save receipt items",
      );
    }
  }

  return receiptId;
}
