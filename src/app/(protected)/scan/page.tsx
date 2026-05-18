import ScanReceipt from "@/src/features/receipt/scan-receipt";

export default function Scan() {
  return (
    <main className="flex flex-col mx-auto w-full max-w-3xl px-6 mt-10">
      <h1 className="text-2xl font-semibold mb-6">Scan receipt</h1>
      <p className="mb-6">
        The groceries written in the receipt will be saved in the pantry, where
        you can generate recipes. Get a recipe without any thinking by just
        uploading an image of your receipt!
      </p>
      <div className="grid grid-cols-2 grid-rows-2 gap-4">
        <div className="row-span-2">
          <ScanReceipt />
        </div>
        <div className="bg-primary rounded-2xl py-6 px-6 auto-rows-min">
          <h2 className="text-lg font-semibold mb-2">Tips</h2>
          <ul>
            <li>- Upload a clear image of the receipt</li>
            <li>- Avoid shadows</li>
            <li>- Use good lighting</li>
            <li>- The app does not store payment info</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
