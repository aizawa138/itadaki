import type { Database } from "@/src/types/supabase";

export type ReceiptInsert = Database["public"]["Tables"]["receipts"]["Insert"];
export type ReceiptItemInsert =
  Database["public"]["Tables"]["receipt_items"]["Insert"];

export type ReceiptProps = {
  receipt: Omit<ReceiptInsert, "id" | "created_at" | "user_id" | "image_url">;
  receipt_items: Array<
    Omit<ReceiptItemInsert, "id" | "created_at" | "receipt_id">
  >;
};

export type HandleReceiptState = {
  receiptId: string | null;
  signedUrl: string | null;
  error: string | null;
};
