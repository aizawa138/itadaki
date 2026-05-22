import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";

export const RECEIPT_ITEMS_PAGE_SIZE = 5;

export type ReceiptItemWithReceipt = {
  id: string;
  normalized_name: string | null;
  raw_name: string | null;
  quantity: number | null;
  unit: string | null;
  created_at: string;
  receipt_id: string | null;
  total_price: number | null;
  receipts: {
    id: string;
    purchased_at: string | null;
    store_name: string | null;
    total_amount: number | null;
    currency: string | null;
  };
};

export type PaginatedReceiptItems = {
  items: ReceiptItemWithReceipt[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export default async function fetchPaginatedReceiptItems(
  page = 1,
  pageSize = RECEIPT_ITEMS_PAGE_SIZE,
): Promise<PaginatedReceiptItems> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { count, error: countError } = await supabase
    .from("receipt_items")
    .select("id, receipts!inner(user_id)", { count: "exact", head: true })
    .eq("receipts.user_id", user.id);

  if (countError) {
    throw countError;
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("receipt_items")
    .select(
      `
      id,
      normalized_name,
      raw_name,
      quantity,
      unit,
      created_at,
      receipt_id,
      total_price,
      receipts!inner (
        id,
        purchased_at,
        store_name,
        total_amount,
        currency,
        user_id
      )
    `,
    )
    .eq("receipts.user_id", user.id)
    .order("purchased_at", { ascending: false, foreignTable: "receipts" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const items: ReceiptItemWithReceipt[] = (data ?? []).map((row) => {
    const receipt = Array.isArray(row.receipts)
      ? row.receipts[0]
      : row.receipts;
    return {
      id: row.id,
      normalized_name: row.normalized_name,
      raw_name: row.raw_name,
      quantity: row.quantity,
      unit: row.unit,
      created_at: row.created_at,
      receipt_id: row.receipt_id,
      total_price: row.total_price,
      receipts: {
        id: receipt.id,
        purchased_at: receipt.purchased_at,
        store_name: receipt.store_name,
        total_amount: receipt.total_amount,
        currency: receipt.currency,
      },
    };
  });

  return {
    items,
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
}
