import ScanReceiptForm from "@/src/features/receipt/components/scan-receipt-form";

export default function Scan() {
  return (
    <main className="flex flex-col mx-auto w-full max-w-3xl px-6 mt-10">
      <h1 className="text-2xl font-semibold mb-6">Scan receipt</h1>
      <p className="mb-8">
        The groceries written in the receipt will be saved in the pantry, where
        you can generate recipes. Get a recipe without any thinking by just
        uploading an image of your receipt!
      </p>
      <ScanReceiptForm />
    </main>
  );
}
