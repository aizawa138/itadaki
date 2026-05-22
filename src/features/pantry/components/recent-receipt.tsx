import Link from "next/link";
import fetchPaginatedReceiptDay, {
  type ReceiptWithItems,
} from "../actions/fetch-recent-receipt-item";
import RecentReceiptPagination from "./recent-receipt-pagination";

type RecentReceiptProps = {
  page?: number;
  variant?: "preview" | "full";
};

function formatPurchaseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatQuantity(quantity: number | null) {
  return String(quantity);
}

function countDayItems(receipts: { items: unknown[] }[]) {
  return receipts.reduce((sum, receipt) => sum + receipt.items.length, 0);
}

function ReceiptBlock({ receipt }: { receipt: ReceiptWithItems }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-base font-semibold">
          {receipt.store_name ?? "Unknown store"}
        </h4>
      </div>

      {receipt.items.length === 0 ? (
        <p className="text-sm text-gray-500">No items on this receipt.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {receipt.items.map((item) => {
            const name =
              item.normalized_name ?? item.raw_name ?? "Unknown item";

            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg px-4 py-3"
              >
                <p className="text-sm font-medium truncate min-w-0">{name}</p>
                <div className="flex gap-4 text-right shrink-0">
                  <p className="text-xs my-auto text-background bg-foreground rounded-full px-2 py-1">
                    x {formatQuantity(item.quantity) || "—"}
                  </p>
                  {item.total_price != null && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {receipt.currency
                        ? `${receipt.currency}${item.total_price}`
                        : item.total_price}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function RecentReceipt({
  page = 1,
  variant = "full",
}: RecentReceiptProps) {
  const queryPage = variant === "preview" ? 1 : page;
  const {
    day,
    page: currentPage,
    totalDays,
    totalPages,
  } = await fetchPaginatedReceiptDay(queryPage);

  const isPreview = variant === "preview";
  const receiptsToShow = isPreview
    ? (day?.receipts.slice(0, 1) ?? [])
    : (day?.receipts ?? []);
  const hiddenReceiptCount = day
    ? Math.max(0, day.receipts.length - receiptsToShow.length)
    : 0;
  const itemCount = day ? countDayItems(day.receipts) : 0;

  return (
    <section className="w-full rounded-xl border border-gray-300 p-4 bg-background">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold">Recent Receipts</h2>
        {totalDays > 0 && (
          <p className="text-sm text-gray-500">
            {totalDays} {totalDays === 1 ? "day" : "days"}
          </p>
        )}
      </div>

      {!day || day.receipts.length === 0 ? (
        <p className="text-sm text-gray-500">
          No receipt items yet. Scan a receipt to see items here.
        </p>
      ) : (
        <>
          <header className="mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              {formatPurchaseDate(day.purchaseDate)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isPreview ? (
                <>
                  {receiptsToShow.length} of {day.receipts.length}{" "}
                  {day.receipts.length === 1 ? "receipt" : "receipts"} shown
                </>
              ) : (
                <>
                  {day.receipts.length}{" "}
                  {day.receipts.length === 1 ? "receipt" : "receipts"} ·{" "}
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </>
              )}
            </p>
          </header>

          <div className="flex flex-col gap-6">
            {receiptsToShow.map((receipt) => (
              <div key={receipt.id}>
                <ReceiptBlock receipt={receipt} />
                <hr className="-px-1 text-gray-300 my-4" />
                {receipt.total_amount != null && (
                  <p className="text-gray-500 shrink-0 text-right mr-4">
                    {receipt.currency ? `Total: ${receipt.currency}` : ""}
                    {receipt.total_amount}
                  </p>
                )}
              </div>
            ))}
          </div>

          {isPreview && (hiddenReceiptCount > 0 || totalPages > 1) && (
            <p className="text-sm mt-4 text-right">
              <Link
                href={`/receipts?receiptPage=${currentPage}`}
                className="text-secondary font-medium hover:underline"
              >
                {hiddenReceiptCount > 0
                  ? `View all ${day.receipts.length} receipts from this day`
                  : "View receipt history"}
              </Link>
            </p>
          )}

          {!isPreview && (
            <RecentReceiptPagination
              page={currentPage}
              totalPages={totalPages}
            />
          )}
        </>
      )}
    </section>
  );
}
