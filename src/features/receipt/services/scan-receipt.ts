"use server";

import { GoogleGenAI } from "@google/genai";
import { RECEIPT_PARSE_PROMPT } from "../prompt";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
});

export async function scanReceipt(formData: FormData) {
  const file = formData.get("receipt") as File;

  if (!file) {
    return { error: "No file uploaded" };
  }

  const bytes = await file.arrayBuffer();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        inlineData: {
          mimeType: file.type,
          data: Buffer.from(bytes).toString("base64"),
        },
      },
      {
        text: RECEIPT_PARSE_PROMPT,
      },
    ],
  });

  return {
    result: response.text,
  };
}
