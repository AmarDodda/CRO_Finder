// web/src/app/auth/signout/route.ts
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

export async function POST() {
  const sb = await getServerSupabase();
  await sb.auth.signOut(); // clears the auth cookies
  return NextResponse.json({ ok: true });
}
