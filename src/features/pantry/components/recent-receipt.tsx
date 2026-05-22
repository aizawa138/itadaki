import fetchPaginatedReceiptItems from "../actions/fetch-recent-receipt-item";
import RecentReceiptPagination from "./recent-receipt-pagination";

type RecentReceiptProps = {
  page?: number;
};

function formatPurchasedAt(value: string | null) {
  if (!value) {
    return "Date unknown";
  }
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatQuantity(quantity: number | null, unit: string | null) {
  if (quantity == null) {
    return unit ?? "";
  }
  return unit ? `${quantity} ${unit}` : String(quantity);
}

export default async function RecentReceipt({ page = 1 }: RecentReceiptProps) {
  const {
    items,
    page: currentPage,
    totalCount,
    totalPages,
  } = await fetchPaginatedReceiptItems(page);

  return (
    <section className="w-full rounded-xl border border-gray-300 p-4 bg-background">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold">Recent Receipt Items</h2>
        {totalCount > 0 && (
          <p className="text-sm text-gray-500">{totalCount} items</p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          No receipt items yet. Scan a receipt to see items here.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const name =
                item.normalized_name ?? item.raw_name ?? "Unknown item";
              const receipt = item.receipts;

              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold truncate">{name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {receipt.store_name ?? "Unknown store"} ·{" "}
                      {formatPurchasedAt(receipt.purchased_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {formatQuantity(item.quantity, item.unit) || "—"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <RecentReceiptPagination page={currentPage} totalPages={totalPages} />
        </>
      )}
    </section>
  );
}
