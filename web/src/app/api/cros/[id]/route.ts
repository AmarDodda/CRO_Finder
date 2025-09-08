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

// // Optional method guards (keeps logs clean if someone hits other verbs)
// export async function GET() {
//   return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
// }
// export async function POST() {
//   return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
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

//     // Parse body and build payload (map UI 'contact' -> 'contact_email')
//     const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;

//     const allow = ["name", "website", "country", "contact_email", "specialties"] as const;
//     const payload: Record<string, any> = {};
//     for (const k of allow) {
//       if (k in raw) payload[k] = raw[k];
//     }
//     if ("contact" in raw && !("contact_email" in payload)) {
//       payload.contact_email = raw.contact;
//     }

//     // No-op guard
//     if (Object.keys(payload).length === 0) {
//       return NextResponse.json({ error: "No fields to update" }, { status: 400 });
//     }

//     // Light normalization / validation
//     if (typeof payload.website === "string") {
//       payload.website = payload.website.trim();
//       if (payload.website && !/^https?:\/\//i.test(payload.website)) {
//         payload.website = `https://${payload.website}`;
//       }
//     }

//     if (typeof payload.contact_email === "string") {
//       payload.contact_email = payload.contact_email.trim().toLowerCase();
//       if (payload.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.contact_email)) {
//         return NextResponse.json({ error: "Invalid contact email" }, { status: 400 });
//       }
//     }

//     if (Array.isArray(payload.specialties)) {
//       payload.specialties = payload.specialties.map((s) => String(s).trim()).filter(Boolean);
//     } else if (typeof payload.specialties === "string") {
//       payload.specialties = payload.specialties
//         .split(",")
//         .map((s: string) => s.trim())
//         .filter(Boolean);
//     }

//     // Update only if the signed-in user owns this CRO
//     const { data, error } = await sb
//       .from("cros")
//       .update(payload)
//       .eq("id", params.id)
//       .eq("owner", user.id)
//       .select("id,name,website,country,contact_email,specialties")
//       .maybeSingle();

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }
//     if (!data) {
//       return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
//     }

//     return NextResponse.json({ ok: true, cro: data });
//   } catch (err: unknown) {
//   const msg = err instanceof Error ? err.message : "Unknown error";
//   return NextResponse.json({ error: msg }, { status: 500 });
// }
// }


// app/api/cros/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { z } from "zod";

async function getServerSupabase() {
  const jar = await cookies();
  const cookiesApi: CookieMethodsServer = {
    getAll: () => jar.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        jar.set(name, value, options);
      }
    },
  };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookiesApi },
  );
}

// Optional method guards (keeps logs clean if someone hits other verbs)
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

/** Body schema (accepts either array or comma-separated string for specialties).
 *  Also supports `contact` as an alias for `contact_email`.
 */
const BodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    website: z.string().trim().min(1).optional(), // we'll normalize to https://... below
    country: z.string().trim().max(80).optional(),
    contact_email: z.string().trim().email().optional(),
    specialties: z.union([z.array(z.string()), z.string().trim()]).optional(),
    contact: z.string().trim().email().optional(), // alias
  })
  .strict();

type PatchParams = { params: { id: string } };

export async function PATCH(req: Request, { params }: PatchParams) {
  try {
    const sb = await getServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse & validate body with Zod
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json({ error: details }, { status: 400 });
    }

    const { name, country, specialties, contact } = parsed.data;
    let { website, contact_email } = parsed.data; 

    // Map alias contact → contact_email if contact_email not provided
    if (contact && !contact_email) contact_email = contact;

    // Normalize website: add https:// if missing scheme
    if (website) {
      website = website.trim();
      if (website && !/^https?:\/\//i.test(website)) {
        website = `https://${website}`;
      }
    }

    // Normalize specialties to string[]
    let normalizedSpecialties: string[] | undefined;
    if (typeof specialties === "string") {
      normalizedSpecialties = specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(specialties)) {
      normalizedSpecialties = specialties.map((s) => String(s).trim()).filter(Boolean);
    }

    // Build payload (only include provided fields)
    const payload: {
      name?: string;
      website?: string;
      country?: string;
      contact_email?: string;
      specialties?: string[];
    } = {};
    if (typeof name === "string") payload.name = name;
    if (typeof website === "string") payload.website = website;
    if (typeof country === "string") payload.country = country;
    if (typeof contact_email === "string") payload.contact_email = contact_email;
    if (normalizedSpecialties) payload.specialties = normalizedSpecialties;

    // No-op guard
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
