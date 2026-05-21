"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ScanReceipt from "./scan-receipt";
import { Button } from "@/src/components/ui/button/button";
import {
  enqueueReceiptScanJobAction,
  type EnqueueReceiptScanJobState,
} from "@/src/features/receipt/actions";

const initialState: EnqueueReceiptScanJobState = {
  jobId: null,
  error: null,
};

export default function ScanReceiptForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    enqueueReceiptScanJobAction,
    initialState,
  );
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (!state.jobId) return;
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    const params = new URLSearchParams();
    if (state.error) params.set("enqueueError", state.error);
    const qs = params.toString();
    router.push(`/scan/jobs/${state.jobId}${qs ? `?${qs}` : ""}`);
  }, [router, state.error, state.jobId]);

  return (
    <>
      <form action={formAction}>
        <div className="grid grid-cols-2 grid-rows-2 gap-8 mb-8">
          <div className="row-span-2">
            <ScanReceipt />

            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}

            {state.jobId ? (
              <p className="text-sm text-muted-foreground">
                Queued. Job ID: {state.jobId}
              </p>
            ) : null}
          </div>
          <div className="bg-primary rounded-2xl py-6 px-6 auto-rows-min">
            <h2 className="text-lg font-semibold mb-2">Tips</h2>
            <ul>
              <li>- Upload a clear image of the receipt</li>
              <li>- Avoid shadows</li>
              <li>- Use good lighting</li>
              <li>- The app does not store payment info</li>
              <li>
                - Must be less than{" "}
                <b>
                  <u>5 MB</u>
                </b>
              </li>
            </ul>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
          variant="secondary"
          className="w-full"
        >
          {isPending ? "Scanning..." : "Scan & Save"}
        </Button>
      </form>
    </>
  );
}
