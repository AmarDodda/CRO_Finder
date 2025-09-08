// src/lib/embedText.ts
const HF_URL = `https://api-inference.huggingface.co/models/${process.env.HF_MODEL ?? "BAAI/bge-small-en-v1.5"}`;
const HF_HEADERS = {
  Authorization: `Bearer ${process.env.HF_TOKEN!}`,
  "Content-Type": "application/json",
};

function l2norm(v: number[]) {
  const s = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / s);
}

async function hfEmbedOnce(text: string, timeoutMs = 12000): Promise<number[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const r = await fetch(HF_URL, {
      method: "POST",
      headers: HF_HEADERS,
      body: JSON.stringify({
        inputs: [text],
        options: { wait_for_model: true }, // cold starts
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const msg = await r.text().catch(() => `${r.status}`);
      throw new Error(`HF ${r.status} ${msg.slice(0, 240)}`);
    }
    const json = await r.json();

    // HF feature-extraction models return shape like: [[...vector...]]
    const vec: number[] = Array.isArray(json?.[0]) ? json[0] : json;
    if (!Array.isArray(vec) || typeof vec[0] !== "number") {
      throw new Error("Unexpected HF embeddings response shape");
    }
    return l2norm(vec);
  } finally {
    clearTimeout(t);
  }
}

export async function embedText(text: string): Promise<number[]> {
  // Trim overly long inputs to reduce latency & cost.
  const safe = text.length > 2000 ? text.slice(0, 2000) : text;

  const maxRetries = 3;
  let delay = 600; // ms, exponential backoff
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await hfEmbedOnce(safe);
    } catch (err: unknown) {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : JSON.stringify(err);

  const retriable =
    msg.includes("504") ||
    msg.includes("timed out") ||
    msg.includes("aborted") ||
    msg.includes("429") ||
    msg.includes("Bad Gateway") ||
    msg.includes("ECONNRESET");

  if (!retriable || i === maxRetries - 1) {
    // Final failure: bubble up a typed error your route can handle
    throw new Error(`EmbeddingsUnavailable: ${msg}`);
  }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  // unreachable
  throw new Error("EmbeddingsUnavailable: unknown");
}
