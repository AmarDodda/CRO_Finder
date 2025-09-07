import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { cro_id, project_id } = await req.json();
    if (!cro_id) return NextResponse.json({ error: "cro_id required" }, { status: 400 });

    // ✅ Next 15: await cookies() and use getAll/setAll
    const cookieStore = await cookies();
    const cookieMethods: CookieMethodsServer = {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    };

    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieMethods }
    );

    const { data: { user } } = await sb.auth.getUser();

    const { error } = await supabaseAdmin.from("notifications").insert([{
      type: "visit",
      cro_id,
      project_id: project_id ?? null,
      actor: user?.id ?? null,
      payload: {},
    }]);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server error" }, { status: 500 });
  }
}
