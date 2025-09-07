import "server-only";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
// Make sure EditCroForm exists at the specified path, or update the path if needed
import EditCroForm from "./ui/EditCroForm";

export const dynamic = "force-dynamic";

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

export default async function CroEditPage({ params }: { params: { id: string } }) {
  const sb = await getServerSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
            <h1 className="text-xl font-semibold text-slate-900">You’re not signed in</h1>
            <Link href="/auth?role=cro&mode=login" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Load only the CRO the signed-in user owns
  const { data: cro } = await sb
    .from("cros")
    .select("id,name,website,country,contact_email,specialties,owner")
    .eq("id", params.id)
    .eq("owner", user.id)
    .maybeSingle();

  if (!cro) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-rose-900 shadow-sm">
            <h1 className="text-lg font-semibold">Not found or not authorized</h1>
            <p className="mt-1 text-sm">We couldn’t find that CRO profile or you don’t have permission to edit it.</p>
            <Link href="/cros/me" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Go to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
      {/* Banner: match home/auth theme */}
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">Edit CRO profile</div>
              <h1 className="mt-1 text-2xl font-semibold">{cro.name ?? "Untitled CRO"}</h1>
            </div>
            <Link
              href={`/cros/${cro.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              Preview →
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="md:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <EditCroForm cro={cro} />
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-violet-500" /> Use your official website & contact email.</li>
              <li><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-sky-500" /> Add specialties (e.g., Oncology, Rare Disease, PK/PD).</li>
              <li><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Keep country/location accurate for matching.</li>
            </ul>
            <Link href="/cros/me" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Back to dashboard
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
