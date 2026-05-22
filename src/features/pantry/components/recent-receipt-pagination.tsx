import { Button } from "@/src/components/ui/button/button";
import Link from "next/link";

type RecentReceiptPaginationProps = {
  page: number;
  totalPages: number;
};

export default function RecentReceiptPagination({
  page,
  totalPages,
}: RecentReceiptPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const prevHref = page > 1 ? `/receipts?receiptPage=${page - 1}` : null;
  const nextHref =
    page < totalPages ? `/receipts?receiptPage=${page + 1}` : null;

  return (
    <nav
      className="flex items-center justify-between gap-4 pt-4 border-t border-gray-300"
      aria-label="Receipt items pagination"
    >
      {prevHref ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={prevHref}>Previous</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      {nextHref ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={nextHref}>Next</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      )}
    </nav>
  );
}
