import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";

export const RECEIPT_DAYS_PAGE_SIZE = 1;
const PURCHASE_DAY_TIMEZONE = "Pacific/Auckland";

export type ReceiptItemSummary = {
  id: string;
  normalized_name: string | null;
  raw_name: string | null;
  quantity: number | null;
  unit: string | null;
  total_price: number | null;
};

export type ReceiptWithItems = {
  id: string;
  store_name: string | null;
  purchased_at: string | null;
  total_amount: number | null;
  currency: string | null;
  items: ReceiptItemSummary[];
};

export type ReceiptDayPage = {
  purchaseDate: string;
  receipts: ReceiptWithItems[];
};

export type PaginatedReceiptDays = {
  day: ReceiptDayPage | null;
  page: number;
  totalDays: number;
  totalPages: number;
};

function getPurchaseDayBounds(purchaseDate: string) {
  const start = `${purchaseDate}T00:00:00+12:00`;
  const anchor = new Date(`${purchaseDate}T12:00:00+12:00`);
  anchor.setDate(anchor.getDate() + 1);
  const nextDate = anchor.toLocaleDateString("en-CA", {
    timeZone: PURCHASE_DAY_TIMEZONE,
  });
  const end = `${nextDate}T00:00:00+12:00`;
  return { start, end };
}

function mapReceiptItems(
  items: ReceiptItemSummary[] | null | undefined,
): ReceiptItemSummary[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    normalized_name: item.normalized_name,
    raw_name: item.raw_name,
    quantity: item.quantity,
    unit: item.unit,
    total_price: item.total_price,
  }));
}

export default async function fetchPaginatedReceiptDay(
  page = 1,
): Promise<PaginatedReceiptDays> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: totalDaysRaw, error: countError } = await supabase.rpc(
    "count_distinct_purchase_days",
  );

  if (countError) {
    throw countError;
  }

  const totalDays = Number(totalDaysRaw ?? 0);
  const totalPages = Math.max(1, totalDays);
  const safePage =
    totalDays === 0 ? 1 : Math.min(Math.max(1, page), totalPages);

  if (totalDays === 0) {
    return {
      day: null,
      page: 1,
      totalDays: 0,
      totalPages: 1,
    };
  }

  const { data: purchaseDateRaw, error: dayError } = await supabase.rpc(
    "get_distinct_purchase_day_at_page",
    {
      p_page: safePage,
      p_page_size: RECEIPT_DAYS_PAGE_SIZE,
    },
  );

  if (dayError) {
    throw dayError;
  }

  const purchaseDate = purchaseDateRaw as string | null;
  if (!purchaseDate) {
    return {
      day: null,
      page: safePage,
      totalDays,
      totalPages,
    };
  }

  const { start, end } = getPurchaseDayBounds(purchaseDate);

  const { data, error } = await supabase
    .from("receipts")
    .select(
      `
      id,
      purchased_at,
      store_name,
      total_amount,
      currency,
      receipt_items (
        id,
        normalized_name,
        raw_name,
        quantity,
        unit,
        total_price
      )
    `,
    )
    .eq("user_id", user.id)
    .gte("purchased_at", start)
    .lt("purchased_at", end)
    .order("purchased_at", { ascending: false })
    .order("created_at", { foreignTable: "receipt_items", ascending: false });

  if (error) {
    throw error;
  }

  const receipts: ReceiptWithItems[] = (data ?? []).map((row) => ({
    id: row.id,
    store_name: row.store_name,
    purchased_at: row.purchased_at,
    total_amount: row.total_amount,
    currency: row.currency,
    items: mapReceiptItems(
      row.receipt_items as ReceiptItemSummary[] | null | undefined,
    ),
  }));

  return {
    day: {
      purchaseDate,
      receipts,
    },
    page: safePage,
    totalDays,
    totalPages,
  };
}
