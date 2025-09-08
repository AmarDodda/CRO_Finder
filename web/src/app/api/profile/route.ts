// // app/api/profile/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// export const dynamic = "force-dynamic";

// /** Shared: Next 15-safe cookie adapter (writes allowed in Route Handlers) */
// async function getServerSupabase() {
//   const cookieStore = await cookies();
//   const cookieMethods: CookieMethodsServer = {
//     getAll() {
//       return cookieStore.getAll();
//     },
//     setAll(cookiesToSet) {
//       cookiesToSet.forEach(({ name, value, options }) => {
//         cookieStore.set(name, value, options);
//       });
//     },
//   };

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     { cookies: cookieMethods }
//   );
// }

// /**
//  * POST /api/profile
//  * Bootstrap/upsert profile (your existing flow)
//  */
// export async function POST(req: Request) {
//   try {
//     const { role, full_name } = await req.json().catch(() => ({}));
//     if (role && !["sponsor", "cro"].includes(role)) {
//       return NextResponse.json({ error: "invalid role" }, { status: 400 });
//     }

//     const sb = await getServerSupabase();
//     const { data: { user } } = await sb.auth.getUser();
//     if (!user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

//     const updates: Record<string, any> = {
//       id: user.id,
//       email: user.email,
//     };
//     if (role) updates.role = role;
//     if (full_name) updates.full_name = String(full_name).trim();

//     const { error } = await supabaseAdmin
//       .from("user_profiles")
//       .upsert(updates, { onConflict: "id" });

//     if (error) throw error;
//     return NextResponse.json({ ok: true });
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message ?? "server error" }, { status: 500 });
//   }
// }

// export async function PATCH(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const cookieMethods: CookieMethodsServer = {
//       getAll: () => cookieStore.getAll(),
//       setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
//     };
//     const sb = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       { cookies: cookieMethods }
//     );

//     const { data: { user } } = await sb.auth.getUser();
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json().catch(() => ({}));
//     const updates: Record<string, any> = {};
//     if (typeof body.full_name === "string") {
//       const cleaned = body.full_name.trim();
//       if (!cleaned) return NextResponse.json({ error: "full_name cannot be empty" }, { status: 400 });
//       if (cleaned.length > 80) return NextResponse.json({ error: "full_name too long (max 80)" }, { status: 400 });
//       updates.full_name = cleaned;
//     }

//     if (Object.keys(updates).length === 0) {
//       return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
//     }

//     // Use admin client to bypass RLS, same as your POST upsert
//     const { data, error } = await supabaseAdmin
//       .from("user_profiles")
//       .update(updates)
//       .eq("id", user.id)
//       .select("id,full_name,email,role")
//       .maybeSingle();

//     if (error) return NextResponse.json({ error: error.message }, { status: 400 });
//     if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

//     return NextResponse.json({ ok: true, profile: data });
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
//   }
// }

// src/app/api/profile/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** ──────────────────────────────────────────────────────────────
 * Types & Validation
 * ────────────────────────────────────────────────────────────── */
const RoleEnum = z.enum(["sponsor", "cro"]);

const PostBodySchema = z.object({
  role: RoleEnum.optional(),
  full_name: z.string().trim().min(1).max(80).optional(),
});

type PostBody = z.infer<typeof PostBodySchema>;

const PatchBodySchema = z.object({
  full_name: z.string().trim().min(1, "full_name cannot be empty").max(80, "full_name too long (max 80)"),
});

type PatchBody = z.infer<typeof PatchBodySchema>;

type Profile = {
  id: string;
  email: string | null;
  role: "sponsor" | "cro" | null;
  full_name: string | null;
};

/** ──────────────────────────────────────────────────────────────
 * Next 15-safe cookie adapter (Route Handlers can write cookies)
 * ────────────────────────────────────────────────────────────── */
async function getServerSupabase() {
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

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods },
  );
}

/** ──────────────────────────────────────────────────────────────
 * POST /api/profile  — Bootstrap/upsert profile
 * Body: { role?: "sponsor"|"cro", full_name?: string }
 * ────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    const body = PostBodySchema.parse((await req.json()) as unknown) as PostBody;

    const sb = await getServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await sb.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const updates: Partial<Profile> & { id: string } = {
      id: user.id,
      email: user.email ?? null,
    };
    if (body.role) updates.role = body.role;
    if (body.full_name) updates.full_name = body.full_name;

    const { error } = await supabaseAdmin
      .from("user_profiles")
      .upsert(updates, { onConflict: "id" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** ──────────────────────────────────────────────────────────────
 * PATCH /api/profile  — Update mutable fields (currently full_name)
 * Body: { full_name: string }
 * ────────────────────────────────────────────────────────────── */
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieMethods: CookieMethodsServer = {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
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
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = PatchBodySchema.parse((await req.json()) as unknown) as PatchBody;

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .update({ full_name: body.full_name })
      .eq("id", user.id)
      .select<"id,full_name,email,role">()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    return NextResponse.json({ ok: true, profile: data as Profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
