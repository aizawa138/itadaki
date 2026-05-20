export const RECEIPT_PARSE_PROMPT = `
Analyze this grocery receipt image.

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
  "success"
  "partial"
  "failed"

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

Examples:
BNNA -> Banana
CHK BRST -> Chicken Breast
MLK TRM -> Trim Milk
TMTO -> Tomato

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
  "receipt": {
    "store_name": string | null,
    "total_amount": number | null,
    "currency": string | null,
    "purchased_at": string | null,
    "ocr_status": "success" | "partial" | "failed"
  },
  "receipt_items": [
    {
      "raw_name": string,
      "normalized_name": string,
      "quantity": number | null,
      "unit": string | null,
      "unit_price": number | null,
      "total_price": number | null,
      "confidence_score": number
    }
  ]
}

Only return JSON.
`;
