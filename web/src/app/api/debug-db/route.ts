// app/api/debug-db/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data: rows, error } = await supabaseAdmin
    .from("projects")
    .select("id, title")
    .limit(3);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows });
}
