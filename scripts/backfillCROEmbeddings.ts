// scripts/backfillCROEmbeddings.ts
/* eslint-disable no-console */
import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// ---- env ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const HF_MODEL = process.env.HF_MODEL ?? 'BAAI/bge-small-en-v1.5';
const HF_TOKEN = process.env.HF_TOKEN!;
const EMBED_DIM = Number(process.env.EMBED_DIM ?? '384');

const TARGET_EMBED_COL = process.env.TARGET_EMBED_COL ?? 'embedding';

// ---- supabase admin client ----
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// ---- helpers ----
function l2norm(vec: number[]): number[] {
  const s = Math.sqrt(vec.reduce((a, x) => a + x * x, 0)) || 1;
  return vec.map((x) => x / s);
}

async function hfEmbedOnce(text: string, timeoutMs = 12000): Promise<number[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: [text.slice(0, 2000)], options: { wait_for_model: true } }),
      signal: ctrl.signal as any,
    });
    if (!r.ok) {
      const msg = await r.text().catch(() => String(r.status));
      throw new Error(`HF ${r.status} ${msg.slice(0, 240)}`);
    }
    const json: any = await r.json();
    const vec: number[] = Array.isArray(json?.[0]) ? json[0] : json;
    if (!Array.isArray(vec) || typeof vec[0] !== 'number') throw new Error('Unexpected HF response');
    if (vec.length !== EMBED_DIM) throw new Error(`dim mismatch: expected ${EMBED_DIM}, got ${vec.length}`);
    return l2norm(vec);
  } finally {
    clearTimeout(t);
  }
}

async function embedWithRetry(text: string, tries = 3): Promise<number[]> {
  let backoff = 600;
  for (let i = 0; i < tries; i++) {
    try {
      return await hfEmbedOnce(text);
    } catch (e: any) {
      const msg = String(e?.message || e);
      const retriable =
        /504|502|429|timeout|aborted|econnreset/i.test(msg);
      if (!retriable || i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
    }
  }
  throw new Error('unreachable');
}

// ---- main backfill loop ----
async function backfill(batchSize = 50) {
  let totalUpdated = 0;
  while (true) {
    // Pull a batch of rows missing embeddings
    const { data: rows, error } = await supabase
      .from('cros')
      .select('id, name, country, specialties, embed_text')
      .is(TARGET_EMBED_COL as any, null)
      .not('embed_text', 'is', null)
      .limit(batchSize);

    if (error) throw error;
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const { id, embed_text } = row as { id: string; embed_text: string };
      if (!embed_text || !embed_text.trim()) continue;

      try {
        const vec = await embedWithRetry(embed_text);
        const { error: upErr } = await supabase
          .from('cros')
          .update({ [TARGET_EMBED_COL]: vec } as any)
          .eq('id', id);
        if (upErr) throw upErr;

        totalUpdated++;
        if (totalUpdated % 25 === 0) console.log(`Updated ${totalUpdated} rows...`);
      } catch (e) {
        console.error('Failed embedding for CRO', id, e);
        // continue with next row
      }
    }
  }
  console.log(`Backfill complete. Total updated: ${totalUpdated}`);
}

// Run if called directly
if (require.main === module) {
  backfill().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { backfill };


