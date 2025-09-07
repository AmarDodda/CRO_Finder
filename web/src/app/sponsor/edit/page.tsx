// app/sponsor/edit/page.tsx
import "server-only";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import EditSponsorForm from "./ui/EditSponsorForm";

export const dynamic = "force-dynamic";

// RSC-safe: read-only cookie adapter (no writes in a page)
async function getServerSupabase() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: () => {} } }
  );
}

// ✅ Default export is an async React component that always returns JSX
export default async function SponsorEditPage() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
            <h1 className="text-xl font-semibold text-slate-900">You’re not signed in</h1>
            <Link
              href="/auth?role=sponsor&mode=login"
              className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: profile } = await sb
    .from("user_profiles")
    .select("id,full_name,email,role")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
      {/* Banner */}
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">Edit Sponsor profile</div>
              <h1 className="mt-1 text-2xl font-semibold">{profile?.full_name ?? "Sponsor"}</h1>
            </div>
            <Link
              href="/sponsor/me"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="md:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <EditSponsorForm
              profile={{
                id: user.id,
                full_name: profile?.full_name ?? "",
                email: profile?.email ?? "",
              }}
            />
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" /> Use your official work name.</li>
              <li><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-sky-500" /> Email is read-only here.</li>
              <li><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-500" /> Your data stays private.</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
