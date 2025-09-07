// import { NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// export async function POST(req: Request) {
//   try {
//     const { cro_id, project_id, sponsor_email, message } = await req.json();
//     if (!cro_id || !project_id) {
//       return NextResponse.json({ error: "cro_id and project_id are required" }, { status: 400 });
//     }

//     // Record a lightweight inquiry (uses contacts table as a log)
//     // sender/recipient may be null in MVP (service role bypasses RLS)
//     const { error: contactErr } = await supabaseAdmin.from("contacts").insert([{
//       sender: null,
//       recipient: null,
//       project_id,
//       message: message ?? `Sponsor ${sponsor_email ?? "unknown"} is interested in this CRO.`
//     }]);
//     if (contactErr) throw contactErr;

//     // Create a 'contact' notification for the CRO
//     const { error: notifErr } = await supabaseAdmin
//       .from("notifications")
//       .insert([{ cro_id, project_id, type: "contact", meta: { sponsor_email, message } }]);
//     if (notifErr) throw notifErr;

//     return NextResponse.json({ ok: true });
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message ?? "server error" }, { status: 500 });
//   }
// }


// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isUuid(v: unknown) {
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: Request) {
  try {
    const { cro_id, project_id, sponsor_email, message } = await req.json().catch(() => ({}));

    if (!isUuid(cro_id)) {
      return NextResponse.json({ error: "invalid cro_id" }, { status: 400 });
    }
    if (project_id && !isUuid(project_id)) {
      return NextResponse.json({ error: "invalid project_id" }, { status: 400 });
    }

    const jar = await cookies();
    const cookieMethods: CookieMethodsServer = {
      getAll: () => jar.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => jar.set(name, value, options)),
    };
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieMethods }
    );

    const { data: { user } } = await sb.auth.getUser();

    const { data: cro, error: croErr } = await supabaseAdmin
      .from("cros")
      .select("id, owner")
      .eq("id", cro_id)
      .single();

    if (croErr || !cro) {
      return NextResponse.json({ error: "CRO not found" }, { status: 404 });
    }

    const trimmedEmail = sponsor_email ? String(sponsor_email).trim() : "";
    const trimmedMsg = String(message ?? "").trim();
    const messageText =
      trimmedMsg ||
      (trimmedEmail ? `New inquiry from sponsor (${trimmedEmail}).` : "New inquiry from sponsor.");

    // Insert contact (NO sponsor_email column in contacts)
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("contacts")
      .insert({
        recipient: cro.owner,
        sender: user?.id ?? null,
        project_id: project_id ?? null,
        message: messageText,
        sent_at: new Date().toISOString(),
        read_at: null,
      })
      .select("id")
      .maybeSingle();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    // Optional analytics notification (keep email ONLY in meta)
    const { error: notifErr } = await supabaseAdmin
      .from("notifications")
      .insert({
        cro_id,
        project_id: project_id ?? null,
        type: "inquiry",
        actor: user?.id ?? null,
        created_at: new Date().toISOString(),
        meta: trimmedEmail ? { sponsor_email: trimmedEmail } : null,
      });

    // We ignore notifErr on purpose (best-effort)

    return NextResponse.json({ ok: true, id: inserted?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server error" }, { status: 500 });
  }
}
