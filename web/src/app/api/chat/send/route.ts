// import { NextResponse } from "next/server";
// import { supabaseServer } from "@/lib/supabaseServer";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// export const dynamic = "force-dynamic";

// export async function POST(req: Request) {
//   try {
//     const { project_id, recipient, message } = await req.json();

//     if (!project_id || !recipient || !message?.trim()) {
//       return NextResponse.json({ error: "project_id, recipient and message are required" }, { status: 400 });
//     }

//     const sb = await supabaseServer();                 // ✅ non-deprecated overload
//     const { data: { user }, error: userErr } = await sb.auth.getUser();
//     if (userErr || !user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

//     // (optional) friendly FK checks
//     const [senderProf, recipientProf, project] = await Promise.all([
//       supabaseAdmin.from("user_profiles").select("id").eq("id", user.id).maybeSingle(),
//       supabaseAdmin.from("user_profiles").select("id").eq("id", recipient).maybeSingle(),
//       supabaseAdmin.from("projects").select("id").eq("id", project_id).maybeSingle(),
//     ]);
//     if (!senderProf.data)   return NextResponse.json({ error: "sender profile missing" }, { status: 400 });
//     if (!recipientProf.data) return NextResponse.json({ error: "recipient profile missing" }, { status: 400 });
//     if (!project.data)       return NextResponse.json({ error: "project not found" }, { status: 400 });

//     const { error } = await supabaseAdmin.from("contacts").insert([{
//       sender: user.id,
//       recipient,
//       project_id,
//       message: message.trim(),
//     }]);
//     if (error) throw error;

//     return NextResponse.json({ ok: true });
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message ?? "server error" }, { status: 500 });
//   }
// }


// app/api/chat/send/route.ts
// import { NextResponse } from "next/server";
// import { supabaseServer } from "@/lib/supabaseServer";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// export const dynamic = "force-dynamic";

// export async function POST(req: Request) {
//   try {
//     const { project_id, recipient, message } = await req.json();

//     if (!project_id || !recipient || !message?.trim()) {
//       return NextResponse.json({ error: "project_id, recipient and message are required" }, { status: 400 });
//     }

//     // Auth (server-side supabase with cookies wired)
//     const sb = await supabaseServer();
//     const { data: { user }, error: userErr } = await sb.auth.getUser();
//     if (userErr || !user) {
//       return NextResponse.json({ error: "not authenticated" }, { status: 401 });
//     }

//     // Optional sanity checks (fine to keep)
//     const [senderProf, recipientProf, project] = await Promise.all([
//       supabaseAdmin.from("user_profiles").select("id").eq("id", user.id).maybeSingle(),
//       supabaseAdmin.from("user_profiles").select("id").eq("id", recipient).maybeSingle(),
//       supabaseAdmin.from("projects").select("id").eq("id", project_id).maybeSingle(),
//     ]);
//     if (!senderProf.data)   return NextResponse.json({ error: "sender profile missing" }, { status: 400 });
//     if (!recipientProf.data) return NextResponse.json({ error: "recipient profile missing" }, { status: 400 });
//     if (!project.data)       return NextResponse.json({ error: "project not found" }, { status: 400 });

//     // Insert and RETURN the row so the client can replace the optimistic message
//     const row = {
//       sender: user.id,
//       recipient,
//       project_id,
//       message: String(message).trim(),
//       sent_at: new Date().toISOString(),
//       read_at: null as string | null,
//     };

//     const { data, error } = await supabaseAdmin
//       .from("contacts")
//       .insert(row)
//       .select("id,sender,recipient,project_id,message,sent_at,read_at")
//       .single();

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }

//     // Respond with the inserted message object
//     return NextResponse.json({ ok: true, message: data });
//   } catch (err: unknown) {
//   const msg = err instanceof Error ? err.message : "Unknown error";
//   return NextResponse.json({ error: msg }, { status: 500 });
// }
// }


// app/api/chat/send/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Validate request body
const BodySchema = z.object({
  project_id: z.string().uuid(),
  recipient: z.string().uuid(), // must be a valid user_profiles.id (uuid)
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const details = parsed.error.issues.map(i => i.message).join("; ");
      return NextResponse.json({ error: details }, { status: 400 });
    }
    const { project_id, recipient, message } = parsed.data;

    // Auth (server-side supabase with cookies wired)
    const sb = await supabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    // Sanity checks
    const [senderProf, recipientProf, project] = await Promise.all([
      supabaseAdmin.from("user_profiles").select("id").eq("id", user.id).maybeSingle(),
      supabaseAdmin.from("user_profiles").select("id").eq("id", recipient).maybeSingle(),
      supabaseAdmin.from("projects").select("id").eq("id", project_id).maybeSingle(),
    ]);
    if (!senderProf.data) return NextResponse.json({ error: "sender profile missing" }, { status: 400 });
    if (!recipientProf.data) return NextResponse.json({ error: "recipient profile missing" }, { status: 400 });
    if (!project.data) return NextResponse.json({ error: "project not found" }, { status: 400 });

    // Insert and RETURN the row so the client can replace the optimistic message
    const row = {
      sender: user.id,
      recipient,
      project_id,
      message, // already validated & trimmed by zod
      sent_at: new Date().toISOString(),
      read_at: null as string | null,
    };

    const { data, error } = await supabaseAdmin
      .from("contacts")
      .insert(row)
      .select("id,sender,recipient,project_id,message,sent_at,read_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Respond with the inserted message object
    return NextResponse.json({ ok: true, message: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

