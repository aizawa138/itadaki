"use server";

import { GoogleGenAI } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import { RECEIPT_PARSE_PROMPT } from "../prompt";

const MAX_RECEIPT_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function safeParse(text: string) {
  const cleaned = text.trim();

  if (!cleaned) {
    throw new Error("Empty response from model");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // continue
  }

  // Try extracting the first JSON object or array block.
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const candidate = match?.[1]?.trim() ?? cleaned;

  try {
    return JSON.parse(candidate);
  } catch {
    // continue
  }

  try {
    return JSON.parse(jsonrepair(candidate));
  } catch {
    throw new Error("Invalid JSON from model");
  }
}

export async function scanReceipt(formData: FormData) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { error: "Missing GEMINI_API_KEY" };
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const file = formData.get("receipt") as File;

    if (!file) {
      return { error: "No file uploaded" };
    }

    if (!ALLOWED_RECEIPT_IMAGE_MIME_TYPES.has(file.type)) {
      return { error: `Unsupported file type: ${file.type || "(empty)"}` };
    }

    if (file.size > MAX_RECEIPT_IMAGE_BYTES) {
      return { error: "File must be 5MB or smaller" };
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
                mimeType,
                data: base64,
              },
            },
            {
              text: RECEIPT_PARSE_PROMPT,
            },
          ],
        },
      ],
    });

    const parsedObject = safeParse(response.text ?? "");

    return {
      result: parsedObject,
    };
  } catch (e) {
    console.error("scanReceipt failed", e);
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "Failed to scan receipt";

    return {
      error:
        process.env.NODE_ENV === "production"
          ? "Failed to scan receipt"
          : message,
    };
  }
}
