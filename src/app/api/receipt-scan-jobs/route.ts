import { enqueueReceiptScanJobFromFormData } from "@/src/features/receipt/actions/enqueue-scan-job";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await enqueueReceiptScanJobFromFormData(formData);
  return NextResponse.json(result);
}
