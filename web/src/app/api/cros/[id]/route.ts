// // app/api/cros/[id]/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

// async function getServerSupabase() {
//   const jar = await cookies();
//   const cookiesApi: CookieMethodsServer = {
//     getAll: () => jar.getAll(),
//     setAll: (list) => list.forEach(({ name, value, options }) => jar.set(name, value, options)),
//   };
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     { cookies: cookiesApi }
//   );
// }

// export async function PATCH(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const sb = await getServerSupabase();
//     const { data: { user } } = await sb.auth.getUser();
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json().catch(() => ({}));
//     const payload: Record<string, any> = {};
//     const allow = ["name", "website", "country", "contact_email", "specialties"] as const;

//     for (const k of allow) {
//       if (k in body) payload[k] = body[k];
//     }

//     // Optional: normalize inputs
//     if (typeof payload.website === "string" && payload.website && !/^https?:\/\//i.test(payload.website)) {
//       payload.website = `https://${payload.website}`;
//     }
//     if (Array.isArray(payload.specialties)) {
//       payload.specialties = payload.specialties.map((s: string) => String(s).trim()).filter(Boolean);
//     }

//     // Update only if the signed-in user owns this CRO
//     const { data, error } = await sb
//       .from("cros")
//       .update(payload)
//       .eq("id", params.id)
//       .eq("owner", user.id)
//       .select("id")
//       .maybeSingle();

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }

//     return NextResponse.json({ ok: true, id: data?.id ?? params.id });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
//   }
// }


// app/api/cros/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

async function getServerSupabase() {
  const jar = await cookies();
  const cookiesApi: CookieMethodsServer = {
    getAll: () => jar.getAll(),
    setAll: (list) => list.forEach(({ name, value, options }) => jar.set(name, value, options)),
  };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookiesApi }
  );
}

// Optional method guards (keeps logs clean if someone hits other verbs)
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sb = await getServerSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body and build payload (map UI 'contact' -> 'contact_email')
    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const allow = ["name", "website", "country", "contact_email", "specialties"] as const;
    const payload: Record<string, any> = {};
    for (const k of allow) {
      if (k in raw) payload[k] = raw[k];
    }
    if ("contact" in raw && !("contact_email" in payload)) {
      payload.contact_email = raw.contact;
    }

    // No-op guard
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Light normalization / validation
    if (typeof payload.website === "string") {
      payload.website = payload.website.trim();
      if (payload.website && !/^https?:\/\//i.test(payload.website)) {
        payload.website = `https://${payload.website}`;
      }
    }

    if (typeof payload.contact_email === "string") {
      payload.contact_email = payload.contact_email.trim().toLowerCase();
      if (payload.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.contact_email)) {
        return NextResponse.json({ error: "Invalid contact email" }, { status: 400 });
      }
    }

    if (Array.isArray(payload.specialties)) {
      payload.specialties = payload.specialties.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof payload.specialties === "string") {
      payload.specialties = payload.specialties
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    // Update only if the signed-in user owns this CRO
    const { data, error } = await sb
      .from("cros")
      .update(payload)
      .eq("id", params.id)
      .eq("owner", user.id)
      .select("id,name,website,country,contact_email,specialties")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, cro: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
