// scripts/backfillProjectEmbeddings.ts
/* eslint-disable no-console */
import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = must('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE = must('SUPABASE_SERVICE_ROLE_KEY');
const HF_MODEL     = process.env.HF_MODEL ?? 'BAAI/bge-small-en-v1.5'; // 384-d
const HF_TOKEN     = must('HF_TOKEN');
const EMBED_DIM    = Number(process.env.EMBED_DIM ?? '384');
const TARGET_COL   = process.env.TARGET_EMBED_COL ?? 'embedding';      // or 'embedding_384'
const TIMEOUT_MS   = Number(process.env.HF_TIMEOUT_MS ?? '60000');     // 60s per request
const RETRIES      = Number(process.env.HF_RETRIES ?? '5');            // more retries
const BATCH_SIZE   = Number(process.env.BATCH_SIZE ?? '1');            // sequential by default

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

function must(n: string) { const v = process.env[n]; if (!v) throw new Error(`Missing env: ${n}`); return v; }
function l2(v: number[]) { const s = Math.sqrt(v.reduce((a,x)=>a+x*x,0))||1; return v.map(x=>x/s); }

async function hfEmbed(text: string, timeoutMs = TIMEOUT_MS): Promise<number[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: [text.slice(0, 2000)],
        // use_cache speeds warm calls; wait_for_model helps cold starts
        options: { use_cache: true, wait_for_model: true }
      }),
      signal: ctrl.signal as any,
    });
    if (!r.ok) throw new Error(`HF ${r.status} ${await r.text()}`);
    const json: any = await r.json();
    const vec: number[] = Array.isArray(json?.[0]) ? json[0] : json;
    if (!Array.isArray(vec) || typeof vec[0] !== 'number') throw new Error('Unexpected HF response');
    if (vec.length !== EMBED_DIM) throw new Error(`dim mismatch: expected ${EMBED_DIM}, got ${vec.length}`);
    return l2(vec);
  } finally {
    clearTimeout(t);
  }
}

async function embedWithRetry(text: string): Promise<number[]> {
  let backoff = 800;
  for (let i = 0; i < RETRIES; i++) {
    try {
      return await hfEmbed(text);
    } catch (e: any) {
      const msg = String(e?.message || e);
      const retriable = /timeout|aborted|429|5\d\d|ECONNRESET|ETIMEDOUT/i.test(msg);
      if (!retriable || i === RETRIES - 1) throw e;
      await sleep(backoff + Math.floor(Math.random() * 300));
      backoff = Math.min(backoff * 2, 8000);
    }
  }
  throw new Error('unreachable');
}

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

function buildText(p: any) {
  return [
    `Title: ${p.title ?? ''}`,
    p.description ? `Description: ${p.description}` : null,
    p.therapy_area ? `Therapy area: ${p.therapy_area}` : null,
    p.phase ? `Phase: ${p.phase}` : null,
    p.budget != null ? `Budget: ${p.budget}` : null,
  ].filter(Boolean).join('\n');
}

async function backfill(batchSize = BATCH_SIZE) {
  // Optional targeting via envs:
  const ONLY_TITLE = process.env.ONLY_TITLE?.trim();             // e.g. WB-1
  const ONLY_IDS = process.env.ONLY_IDS?.split(',')              // comma-separated UUIDs
                    .map(s => s.trim()).filter(Boolean);

  let total = 0;
  while (true) {
    let q = sb.from('projects')
      .select('id, title, description, therapy_area, phase, budget, embed_text')
      .is(TARGET_COL as any, null)
      .limit(batchSize);

    if (ONLY_TITLE) q = q.eq('title', ONLY_TITLE);
    if (ONLY_IDS && ONLY_IDS.length) q = q.in('id', ONLY_IDS);

    const { data: rows, error } = await q;
    if (error) throw error;
    if (!rows?.length) break;

    for (const p of rows) {
      const text = (p.embed_text && p.embed_text.trim()) || buildText(p);
      if (!text.trim()) { console.warn('Skipping empty project text', p.id); continue; }

      try {
        const vec = await embedWithRetry(text);
        const payload: any = {}; payload[TARGET_COL] = vec;
        const { error: upErr } = await sb.from('projects').update(payload).eq('id', p.id);
        if (upErr) throw upErr;

        total++;
        console.log(`✅ embedded project ${p.id} (${p.title})`);
        // brief pause between calls to be gentle on HF
        await sleep(200);
      } catch (e) {
        console.error('Failed embedding project', p.id, e);
      }
    }
  }
  console.log(`Backfill complete. Total updated: ${total}`);
}

if (require.main === module) {
  backfill().catch(e => { console.error(e); process.exit(1); });
}
