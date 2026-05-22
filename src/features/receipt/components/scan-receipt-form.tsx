"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ScanReceipt from "./scan-receipt";
import { Button } from "@/src/components/ui/button/button";

export default function ScanReceiptForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    router.replace("/pantry");

    void fetch("/api/receipt-scan-jobs", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        const data = (await res.json()) as { error?: string | null };
        if (!res.ok || data.error) {
          console.error("Receipt scan failed:", data.error ?? res.statusText);
        }
      })
      .catch((err) => {
        console.error("Receipt scan request failed:", err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        method="post"
        encType="multipart/form-data"
      >
        <div className="grid grid-cols-2 grid-rows-2 gap-8 mb-8">
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
          disabled={isSubmitting}
          isLoading={isSubmitting}
          variant="secondary"
          className="w-full"
        >
          Scan & Save
        </Button>
      </form>
    </>
  );
}
