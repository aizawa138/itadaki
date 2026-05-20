// Supabase Edge Function: process-receipt-jobs
// - Picks one queued job
// - Downloads the image from Storage
// - Calls Gemini to extract JSON
// - Inserts into receipts + receipt_items
// - Marks job done/error
//
// Deploy:
//   supabase functions deploy process-receipt-jobs
// Secrets required:
//   supabase secrets set GEMINI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonrepair } from "https://esm.sh/jsonrepair@3";
import { GoogleGenAI } from "npm:@google/genai";

const RECEIPT_BUCKET = "receipts";
const MODEL = "gemini-2.5-flash";

const RECEIPT_PARSE_PROMPT = `Analyze this grocery receipt image.

Extract structured receipt data matching the exact JSON schema below.

STRICT RULES:

1. Return valid JSON only
2. Do not wrap output in markdown
3. Do not include explanations
4. Use null when data is not visible or uncertain
5. confidence_score must be between 0 and 1
6. Monetary values must be numbers only
7. Parse timestamps as ISO 8601 when possible

RECEIPT RULES

- Extract store name
- Extract total amount
- Detect currency if possible
- Extract purchase timestamp
- Set ocr_status:
  \"success\"
  \"partial\"
  \"failed\"

ITEM RULES

Extract grocery-related purchased items.

Ignore:
- tax
- subtotal
- total summary rows
- discounts
- loyalty adjustments
- payment method rows
- receipt metadata lines

For each item:

raw_name:
Exact text appearing on receipt

normalized_name:
Human-readable ingredient/product name

quantity:
Infer only if explicit

unit:
Examples:
kg
g
L
mL
pack
bottle
can

unit_price:
Single-item price if visible

total_price:
Final line-item price

JSON SCHEMA:

{
  \"receipt\": {
    \"store_name\": string | null,
    \"total_amount\": number | null,
    \"currency\": string | null,
    \"purchased_at\": string | null,
    \"ocr_status\": \"success\" | \"partial\" | \"failed\"
  },
  \"receipt_items\": [
    {
      \"raw_name\": string,
      \"normalized_name\": string,
      \"quantity\": number | null,
      \"unit\": string | null,
      \"unit_price\": number | null,
      \"total_price\": number | null,
      \"confidence_score\": number
    }
  ]
}

Only return JSON.`;

function safeParse(text: string) {
  const cleaned = (text ?? "").trim();
  if (!cleaned) throw new Error("Empty response from model");

  try {
    return JSON.parse(cleaned);
  } catch {
    // continue
  }

  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const candidate = match?.[1]?.trim() ?? cleaned;

  try {
    return JSON.parse(candidate);
  } catch {
    // continue
  }

  return JSON.parse(jsonrepair(candidate));
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeModelOutput(modelOutput: unknown) {
  const obj = modelOutput as Record<string, unknown>;
  const receiptRaw = (obj?.receipt ?? {}) as Record<string, unknown>;
  const itemsRaw = obj?.receipt_items;

  const receipt = {
    store_name: asStringOrNull(receiptRaw.store_name),
    total_amount: asNumberOrNull(receiptRaw.total_amount),
    currency: asStringOrNull(receiptRaw.currency),
    purchased_at: asStringOrNull(receiptRaw.purchased_at),
    ocr_status: asStringOrNull(receiptRaw.ocr_status),
    ocr_raw_text: null,
  };

  const receipt_items = Array.isArray(itemsRaw)
    ? itemsRaw
        .filter((x) => typeof x === "object" && x !== null && !Array.isArray(x))
        .map((item) => {
          const it = item as Record<string, unknown>;
          return {
            raw_name: asStringOrNull(it.raw_name),
            normalized_name: asStringOrNull(it.normalized_name),
            quantity: asNumberOrNull(it.quantity),
            unit: asStringOrNull(it.unit),
            unit_price: asNumberOrNull(it.unit_price),
            total_price: asNumberOrNull(it.total_price),
            confidence_score: asNumberOrNull(it.confidence_score),
          };
        })
    : [];

  return { receipt, receipt_items };
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

  if (!url || !serviceRoleKey) {
    return new Response("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", {
      status: 500,
    });
  }
  if (!geminiKey) {
    return new Response("Missing GEMINI_API_KEY", { status: 500 });
  }

  const supabase = createClient(url, serviceRoleKey);

  // Find one queued job.
  const { data: job, error: jobError } = await supabase
    .from("receipt_scan_jobs")
    .select("id,user_id,image_path,attempt_count")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (jobError) {
    return new Response(jobError.message, { status: 500 });
  }
  if (!job) {
    return new Response("No queued jobs", { status: 200 });
  }

  // Attempt to claim the job.
  const { data: claimed, error: claimError } = await supabase
    .from("receipt_scan_jobs")
    .update({
      status: "processing",
      attempt_count: (job.attempt_count ?? 0) + 1,
    })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id,user_id,image_path")
    .maybeSingle();

  if (claimError) {
    return new Response(claimError.message, { status: 500 });
  }
  if (!claimed) {
    return new Response("Job already claimed", { status: 200 });
  }

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .download(claimed.image_path);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message ?? "Failed to download image");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      config: {
        temperature: 0,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                // Storage doesn't preserve original mime type. Assume jpeg.
                mimeType: "image/jpeg",
                data: base64,
              },
            },
            { text: RECEIPT_PARSE_PROMPT },
          ],
        },
      ],
    });

    const parsed = safeParse(response.text ?? "");
    const normalized = normalizeModelOutput(parsed);

    const receiptId = crypto.randomUUID();

    const { error: receiptInsertError } = await supabase
      .from("receipts")
      .insert({
        id: receiptId,
        user_id: claimed.user_id,
        image_url: claimed.image_path,
        store_name: normalized.receipt.store_name,
        total_amount: normalized.receipt.total_amount,
        currency: normalized.receipt.currency,
        purchased_at: normalized.receipt.purchased_at,
        ocr_status: normalized.receipt.ocr_status,
        ocr_raw_text: normalized.receipt.ocr_raw_text,
      });

    if (receiptInsertError) {
      throw new Error(receiptInsertError.message);
    }

    if (normalized.receipt_items.length > 0) {
      const items = normalized.receipt_items.map((it) => ({
        receipt_id: receiptId,
        raw_name: it.raw_name,
        normalized_name: it.normalized_name,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        total_price: it.total_price,
        confidence_score: it.confidence_score,
      }));

      const { error: itemsError } = await supabase
        .from("receipt_items")
        .insert(items);

      if (itemsError) {
        throw new Error(itemsError.message);
      }
    }

    const { error: doneError } = await supabase
      .from("receipt_scan_jobs")
      .update({ status: "done", receipt_id: receiptId, error_message: null })
      .eq("id", claimed.id);

    if (doneError) {
      throw new Error(doneError.message);
    }

    return new Response(JSON.stringify({ ok: true, jobId: claimed.id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Job failed";

    await supabase
      .from("receipt_scan_jobs")
      .update({ status: "error", error_message: message })
      .eq("id", claimed.id);

    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
});
