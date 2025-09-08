// src/app/api/debug-env/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const have = (k: string) => (process.env[k] ? "set" : "missing");
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: have("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: have("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: have("SUPABASE_SERVICE_ROLE"),
    HF_TOKEN: have("HF_TOKEN"),
    HF_MODEL: process.env.HF_MODEL ?? "(unset)",
    EMBED_DIM: process.env.EMBED_DIM ?? "(unset)",
    NODE_ENV: process.env.NODE_ENV,
  });
}
