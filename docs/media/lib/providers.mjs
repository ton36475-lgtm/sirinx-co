/**
 * providers.mjs — the ONLY module that talks to a network or spends money.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ UNVERIFIED. This code has never been executed against a live provider.    │
 * │ There is no API key on this machine, so the request/response shapes below │
 * │ are written from the providers' published API documentation, not from an │
 * │ observed exchange. Treat the first real run as a test, not a production  │
 * │ step, and expect to fix something here.                                   │
 * │                                                                          │
 * │ What IS verified is everything in guards.mjs, which runs before any call  │
 * │ in this file is reached.                                                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Nothing here logs a key. Callers pass the credential; this module puts it in a
 * header and forgets it.
 */

import { PipelineRefusal } from "./guards.mjs";

const TIMEOUT_MS = 120_000;

class ProviderError extends Error {
  constructor(provider, status, body) {
    super(`${provider} returned HTTP ${status}: ${String(body).slice(0, 400)}`);
    this.name = "ProviderError";
    this.provider = provider;
    this.status = status;
  }
}

async function postJson(url, { headers, body }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new ProviderError(new URL(url).host, res.status, text);
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * OpenAI image generation.
 * Docs: POST https://api.openai.com/v1/images/generations
 *   { model, prompt, n, size }  ->  data[0].b64_json
 * `size` must be one of the model's supported sizes; the caller is responsible for
 * passing one it already validated against the price table.
 */
export async function generateOpenAiImage({ apiKey, model, prompt, size }) {
  const url = "https://api.openai.com/v1/images/generations";
  const json = await postJson(url, {
    headers: { authorization: `Bearer ${apiKey}` },
    body: { model, prompt, n: 1, size, response_format: "b64_json" },
  });
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new ProviderError("api.openai.com", 200, "response contained no b64_json");
  }
  return { bytes: Buffer.from(b64, "base64"), revisedPrompt: json?.data?.[0]?.revised_prompt ?? null };
}

/**
 * Google Gemini image generation.
 * Docs: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *   Image output requires responseModalities to include "IMAGE"; the image comes back
 *   as inlineData on a part of the first candidate.
 */
export async function generateGeminiImage({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;
  const json = await postJson(url, {
    headers: { "x-goog-api-key": apiKey },
    body: {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    },
  });
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p?.inlineData?.data);
  if (!imagePart) {
    throw new ProviderError(
      "generativelanguage.googleapis.com",
      200,
      `no image part in response; parts=${JSON.stringify(parts).slice(0, 300)}`,
    );
  }
  return {
    bytes: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
    revisedPrompt: parts.find((p) => p?.text)?.text ?? null,
  };
}

/** Dispatch by model id. Unknown models are a refusal, never a guess. */
export async function generateImage({ apiKey, model, prompt, size }) {
  if (model.startsWith("gpt-image") || model.startsWith("dall-e")) {
    if (!size) {
      throw new PipelineRefusal("SIZE_MISSING", `OpenAI model ${model} requires an explicit size.`);
    }
    return generateOpenAiImage({ apiKey, model, prompt, size });
  }
  if (model.startsWith("gemini")) {
    return generateGeminiImage({ apiKey, model, prompt });
  }
  throw new PipelineRefusal("MODEL_UNSUPPORTED", `No client for model id: ${model}`);
}
