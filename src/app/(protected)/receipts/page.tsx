import RecentReceipt from "@/src/features/pantry/components/recent-receipt";

export default async function Receipt(props: {
  searchParams: Promise<{ receiptPage?: string }>;
}) {
  const { receiptPage } = await props.searchParams;
  const page = Math.max(1, Number(receiptPage) || 1);

  return (
    <main className="flex flex-col mx-auto w-full max-w-4xl px-6 mt-10">
      <RecentReceipt page={page} />
    </main>
  );
}
