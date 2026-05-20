"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button/button";
import Image from "next/image";

type JobStatusResponse = {
  id: string;
  status: string;
  receiptId: string | null;
  errorMessage: string | null;
  signedUrl: string | null;
  updatedAt: string | null;
};

export default function ScanJobStatus({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [data, setData] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();

    async function poll() {
      try {
        const res = await fetch(`/api/receipt-scan-jobs/${jobId}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? `Request failed (${res.status})`);
        }

        const json = (await res.json()) as JobStatusResponse;
        if (cancelled) return;

        setData(json);
        setError(null);

        const terminal = json.status === "done" || json.status === "error";
        if (!terminal) {
          timeoutId = setTimeout(poll, 2000);
        }
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Failed to load job";
        setError(message);
      }
    }

    poll();

    return () => {
      cancelled = true;
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobId]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/scan")}>
          Back to scan
        </Button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const done = data.status === "done";
  const failed = data.status === "error";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Job ID</p>
        <p className="text-sm font-mono break-all">{data.id}</p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Status</p>
        <p className="text-sm">{data.status}</p>
      </div>

      {failed ? (
        <p className="text-sm text-destructive">
          {data.errorMessage ?? "Job failed"}
        </p>
      ) : null}

      {done ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Receipt ID</p>
          <p className="text-sm font-mono break-all">{data.receiptId}</p>
        </div>
      ) : null}

      {data.signedUrl ? (
        // Minimal preview so users can confirm the uploaded file.
        <Image
          src={data.signedUrl}
          alt="Receipt"
          className="w-full rounded-xl"
          width={100}
          height={200}
        />
      ) : null}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => router.push("/scan")}>
          Scan another
        </Button>
      </div>
    </div>
  );
}
