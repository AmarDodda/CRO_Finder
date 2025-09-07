// supabase/functions/embed-cro/index.ts
// Edge Function: embed CRO profiles -> public.cros.embedding
// Secrets required: SERVICE_ROLE_KEY, HF_TOKEN
// Optional: HF_MODEL (default BAAI/bge-small-en-v1.5), EMBED_DIM (default 384), FUNCTION_TOKEN

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;           // auto-injected
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;       // set via `supabase secrets set`
const HF_TOKEN     = Deno.env.get("HF_TOKEN")!;               // HF Inference API token
const HF_MODEL     = Deno.env.get("HF_MODEL") ?? "BAAI/bge-small-en-v1.5";
const EMBED_DIM    = Number(Deno.env.get("EMBED_DIM") ?? "384");
const FUNCTION_TOKEN = Deno.env.get("FUNCTION_TOKEN");        // optional extra gate

if (!SUPABASE_URL || !SERVICE_ROLE || !HF_TOKEN) {
  console.error("Missing required secrets: SERVICE_ROLE_KEY and/or HF_TOKEN (SUPABASE_URL is auto)");
}

type CroRow = {
  id: string;
  name: string | null;
  website: string | null;
  country: string | null;
  specialties: string[] | null;
  embedding: unknown | null;
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function croToText(c: CroRow): string {
  const parts = [
    c.name ? `Name: ${c.name}` : "",
    c.country ? `Country: ${c.country}` : "",
    c.website ? `Website: ${c.website}` : "",
    c.specialties?.length ? `Specialties: ${c.specialties.join(", ")}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}

// L2-normalize (good practice for BGE + cosine)
function l2norm(v: number[]): number[] {
  const s = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0)) || 1;
  return v.map((x) => x / s);
}

// Get embeddings from HF Inference API
async function embedBatch(texts: string[]): Promise<number[][]> {
  const resp = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });
  if (!resp.ok) throw new Error(`HF embeddings failed: ${resp.status} ${await resp.text()}`);
  const json = await resp.json();

  // HF may return per-input [D] or per-token [[T x D]]; normalize to [N x D]
  const asArray = Array.isArray(json) ? json : [];
  const meanPool = (tokens: number[][]) => {
    const d = tokens[0].length;
    const out = new Array(d).fill(0);
    for (const t of tokens) for (let i = 0; i < d; i++) out[i] += t[i];
    for (let i = 0; i < d; i++) out[i] /= tokens.length;
    return out;
  };
  const vectors: number[][] = asArray.map((row: any) =>
    Array.isArray(row) && row.length && Array.isArray(row[0]) ? meanPool(row as number[][]) : (row as number[])
  );

  for (const v of vectors) {
    if (!Array.isArray(v) || v.length !== EMBED_DIM) {
      throw new Error(`Unexpected embedding size. Got ${v?.length}, expected ${EMBED_DIM}`);
    }
  }
  return vectors.map(l2norm);
}

// Safer than upsert: UPDATE by id (avoids accidental INSERT needing NOT NULL columns)
async function updateEmbeddings(rows: CroRow[], embeddings: number[][]) {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const vec = embeddings[i];

    // Try updating with tracking columns; if schema doesn't have them, fall back to vector only.
    let { error } = await supabase
      .from("cros")
      .update({
        embedding: vec,
        // comment out the next two if you haven't added these columns yet:
        // embedding_model: HF_MODEL,
        // embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    if (error) {
      // If error references unknown columns, retry minimal update
      const { error: e2 } = await supabase.from("cros").update({ embedding: vec }).eq("id", r.id);
      if (e2) throw e2;
    }
  }
}

const BATCH_SIZE = 16; // friendlier for HF free tier

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Use POST", { status: 405 });

    if (FUNCTION_TOKEN) {
      const token = req.headers.get("x-function-token");
      if (token !== FUNCTION_TOKEN) return new Response("Forbidden", { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const ids: string[] | undefined = payload?.ids;
    const limit = Math.max(1, Math.min(Number(payload?.limit ?? 100), 1000));
    const reembedAll = Boolean(payload?.reembed_all);
    const dryRun = Boolean(payload?.dry_run);

    // Select rows
    let q = supabase
      .from("cros")
      .select("id,name,website,country,specialties,embedding,created_at", { count: "exact" })
      .order("created_at", { ascending: true });

    if (Array.isArray(ids) && ids.length) q = q.in("id", ids);
    else if (!reembedAll) q = q.is("embedding", null).limit(limit);
    else q = q.limit(limit);

    const { data: rows, error, count } = await q;
    if (error) throw error;

    if (!rows?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "No rows to embed." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        processed: 0,
        would_process: rows.length,
        sample: rows.slice(0, 3).map((r) => r.id),
        count_hint: count,
      }), { headers: { "Content-Type": "application/json" } });
    }

    // Build texts and embed in batches
    const texts = (rows as CroRow[]).map(croToText);
    let updated = 0;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      const batchRows = (rows as CroRow[]).slice(i, i + BATCH_SIZE);

      let attempts = 0;
      while (true) {
        try {
          const embs = await embedBatch(batchTexts);
          await updateEmbeddings(batchRows, embs);
          updated += batchRows.length;
          break;
        } catch (e) {
          attempts++;
          if (attempts >= 3) throw e;
          await new Promise((r) => setTimeout(r, 500 * attempts)); // backoff
        }
      }
    }

    return new Response(JSON.stringify({
      processed: (rows as CroRow[]).length,
      updated,
      model: HF_MODEL,
      dim: EMBED_DIM,
      reembed_all: reembedAll,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
