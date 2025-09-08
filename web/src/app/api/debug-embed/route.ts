// src/app/api/debug-embed/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const model = process.env.HF_MODEL ?? "BAAI/bge-small-en-v1.5";
  const token = process.env.HF_TOKEN;
  const dim = Number(process.env.EMBED_DIM ?? "384");

  if (!token) return NextResponse.json({ ok:false, error:"HF_TOKEN missing" }, { status: 500 });

  const r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: "hello world" }),
    cache: "no-store",
  });

  const text = await r.text();
  if (!r.ok) return NextResponse.json({ ok:false, status:r.status, text }, { status: 500 });

  let vec: unknown = null;
  try {
    const json = JSON.parse(text);
    vec = Array.isArray(json) && Array.isArray(json[0]) ? json[0] : json;
  } catch { /* ignore */ }

  const length = Array.isArray(vec) ? vec.length : -1;
  return NextResponse.json({ ok:true, model, reportedDim: dim, returnedDim: length });
}
