import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ✅ Next 15: await cookies() and pass getAll/setAll
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

    const { data: { user }, error: userErr } = await sb.auth.getUser();
    if (userErr) console.error("getUser error:", userErr);
    if (!user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

    // Load CRO + caller profile
    const [{ data: cro }, { data: prof }] = await Promise.all([
      supabaseAdmin.from("cros").select("id, owner, contact_email").eq("id", id).single(),
      supabaseAdmin.from("user_profiles").select("id, role, email").eq("id", user.id).single(),
    ]);

    if (!cro) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (cro.owner) return NextResponse.json({ error: "already owned" }, { status: 400 });

    // Allow if contact_email matches caller email, or caller is admin, or CRO has no email set
    const emailMatches =
      cro.contact_email && prof?.email &&
      cro.contact_email.toLowerCase() === prof.email.toLowerCase();

    if (!(emailMatches || prof?.role === "admin" || !cro.contact_email)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("cros")
      .update({ owner: user.id })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true, owner: user.id });
  } catch (err: unknown) {
  const msg = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ error: msg }, { status: 500 });
}
}
