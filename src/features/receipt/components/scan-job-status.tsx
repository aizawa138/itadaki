"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [data, setData] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/receipt-scan-jobs/${jobId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? `Request failed (${res.status})`);
        }

        const json = (await res.json()) as JobStatusResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load job";
        if (!cancelled) setError(message);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button asChild variant="secondary">
          <Link href="/scan">Back to scan</Link>
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
        />
      ) : null}

      <div className="flex gap-2">
        <Button asChild variant="secondary">
          <Link href="/scan">Scan another</Link>
        </Button>
      </div>
    </div>
  );
}
