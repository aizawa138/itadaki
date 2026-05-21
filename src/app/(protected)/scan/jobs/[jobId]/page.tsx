import ScanJobStatus from "@/src/features/receipt/components/scan-job-status";

export default async function ScanJobPage(props: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await props.params;

  return (
    <main className="flex flex-col mx-auto w-full max-w-3xl px-6 mt-10">
      <h1 className="text-2xl font-semibold mb-6">Receipt scan job</h1>
      <ScanJobStatus jobId={jobId} />
    </main>
  );
}
