"use server";

import { GoogleGenAI } from "@google/genai";
import { RECEIPT_PARSE_PROMPT } from "../prompt";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from model");
    return JSON.parse(match[0]);
  }
}

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get("receipt") as File;

    if (!file) {
      return { error: "No file uploaded" };
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        },
        {
          text: RECEIPT_PARSE_PROMPT,
        },
      ],
    });

    const parsedObject = safeParse(response.text ?? "");

    return {
      result: parsedObject,
    };
  } catch {
    return {
      error: "Failed to scan receipt",
    };
  }
}
