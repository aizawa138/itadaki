"use client";

import { useActionState } from "react";
import ScanReceipt from "./scan-receipt";
import { Button } from "@/src/components/ui/button/button";
import {
  handleReceiptAction,
  type HandleReceiptState,
} from "@/src/features/receipt/actions";

const initialState: HandleReceiptState = {
  receiptId: null,
  signedUrl: null,
  error: null,
};

export default function ScanReceiptForm() {
  const [state, formAction, isPending] = useActionState(
    handleReceiptAction,
    initialState,
  );

  return (
    <>
      <form action={formAction}>
        <div className="grid grid-cols-2 grid-rows-2 gap-8 mb-8">
          <div className="row-span-2">
            <ScanReceipt />

            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}

            {state.receiptId ? (
              <p className="text-sm text-muted-foreground">
                Saved. Receipt ID: {state.receiptId}
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
