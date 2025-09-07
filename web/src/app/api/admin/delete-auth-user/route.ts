// app/api/admin/delete-auth-user/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // must use service_role key

export async function POST(req: Request) {
  const { userId } = await req.json(); // the auth.user.id
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
