// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// export const dynamic = "force-dynamic";

// export async function POST(req: Request) {
//   try {
//     const { cro_id, project_id } = await req.json();
//     if (!cro_id) return NextResponse.json({ error: "cro_id required" }, { status: 400 });

//     // ✅ Next 15: await cookies() and use getAll/setAll
//     const cookieStore = await cookies();
//     const cookieMethods: CookieMethodsServer = {
//       getAll() {
//         return cookieStore.getAll();
//       },
//       setAll(cookiesToSet) {
//         cookiesToSet.forEach(({ name, value, options }) => {
//           cookieStore.set(name, value, options);
//         });
//       },
//     };

//     const sb = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       { cookies: cookieMethods }
//     );

//     const { data: { user } } = await sb.auth.getUser();

//     const { error } = await supabaseAdmin.from("notifications").insert([{
//       type: "visit",
//       cro_id,
//       project_id: project_id ?? null,
//       actor: user?.id ?? null,
//       payload: {},
//     }]);
//     if (error) throw error;

//     return NextResponse.json({ ok: true });
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message ?? "server error" }, { status: 500 });
//   }
// }


// src/app/api/notify-visit/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Validate input body
const BodySchema = z.object({
  cro_id: z.string().uuid(),           // required
  project_id: z.string().uuid().optional(), // optional
});

export async function POST(req: Request) {
  try {
    // Parse & validate body
    const body = BodySchema.parse((await req.json()) as unknown);
    const { cro_id, project_id } = body;

    // ✅ Next 15: cookies() is async; provide getAll/setAll for @supabase/ssr
    const cookieStore = await cookies();
    const cookieMethods: CookieMethodsServer = {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    };

    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieMethods },
    );

    const {
      data: { user },
      error: authError,
    } = await sb.auth.getUser();

    if (authError) {
      // Not fatal for a visit ping; we can still record anonymously
      // but we include the context in payload.
    }

    const { error: insertError } = await supabaseAdmin.from("notifications").insert([
      {
        type: "visit",
        cro_id,
        project_id: project_id ?? null,
        actor: user?.id ?? null,
        payload: {
          // add light context if desired; safe to remove
          hasUser: Boolean(user?.id),
          ts: new Date().toISOString(),
        },
      },
    ]);

    if (insertError) throw insertError;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg.slice(0, 240) }, { status: 500 });
  }
}
