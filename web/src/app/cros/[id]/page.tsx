


// import { supabaseAdmin } from "@/lib/supabaseAdmin";
// import VisitTracker from "@/components/VisitTracker";
// import ContactBox from "@/components/ContactBox";
// import { cookies } from "next/headers";
// import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

// function isUuid(v: string) {
//   return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
// }

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

// export default async function CroProfile({
//   params,
//   searchParams,
// }: {
//   params: Promise<{ id?: string; croId?: string }>;
//   searchParams: Promise<Record<string, string | string[] | undefined>>;
// }) {
//   // ✅ await the async dynamic APIs
//   const p = await params;
//   const sp = await searchParams;

//   const croId = p.id ?? p.croId;
//   const projectId = Array.isArray(sp.projectId) ? sp.projectId[0] : sp.projectId;

//   if (!croId || !isUuid(croId)) {
//     return <div className="p-6 text-red-600">CRO not found.</div>;
//   }

//   const { data: cro, error } = await supabaseAdmin
//     .from("cros")
//     .select("id,owner,name,website,country,contact_email,specialties")
//     .eq("id", croId)
//     .single();

//   if (error || !cro) {
//     return <div className="p-6 text-red-600">CRO not found.</div>;
//   }

//   const sb = await getServerSupabase();
//   const { data: { user } } = await sb.auth.getUser();
//   const isOwner = user?.id && user.id === cro.owner;

//   return (
//     <div className="max-w-2xl mx-auto p-6 space-y-4">
//       <a
//         className="underline text-sm"
//         href={projectId ? `/matches?projectId=${encodeURIComponent(projectId)}` : "/"}
//       >
//         ← Back
//       </a>

//       <h1 className="text-2xl font-semibold">{cro.name}</h1>

//       {isOwner && (
//         <div className="border rounded p-3 bg-yellow-50 text-sm">
//           You’re viewing your public profile.{" "}
//           <a className="underline" href="/cros/me">Go to your CRO dashboard →</a>
//         </div>
//       )}

//       <div className="text-sm text-gray-700 space-y-1">
//         {cro.country && <div><b>Country:</b> {cro.country}</div>}
//         {cro.website && (
//           <div>
//             <b>Website:</b>{" "}
//             <a className="underline" href={cro.website} target="_blank" rel="noreferrer">
//               {cro.website}
//             </a>
//           </div>
//         )}
//         {cro.contact_email && (
//           <div>
//             <b>Contact Email:</b>{" "}
//             <a className="underline" href={`mailto:${cro.contact_email}`}>{cro.contact_email}</a>
//           </div>
//         )}
//         {Array.isArray(cro.specialties) && cro.specialties.length > 0 && (
//           <div><b>Specialties:</b> {cro.specialties.join(", ")}</div>
//         )}
//       </div>

//       {!isOwner && (
//         <>
//           <ContactBox
//             croId={cro.id}
//             projectId={projectId as string | undefined}
//             contactEmail={cro.contact_email}
//           />
//           <VisitTracker
//             croId={cro.id}
//             projectId={projectId as string | undefined}
//           />
//         </>
//       )}
//     </div>
//   );
// }


// app/cros/[id]/page.tsx (or .../cros/[croId]/page.tsx depending on your routes)
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import VisitTracker from "@/components/VisitTracker";
import ContactBox from "@/components/ContactBox";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import Link from "next/link";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// Read-only Supabase for server components (prevents Next 15 cookie mutation error)
async function getServerSupabaseReadOnly() {
  const jar = await cookies();
  const cookiesApi: CookieMethodsServer = {
    getAll: () => jar.getAll(),
    setAll: () => {}, // no-op: do NOT mutate cookies in a Server Component
  };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookiesApi }
  );
}

export default async function CroProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string; croId?: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ Next 15 dynamic: await
  const p = await params;
  const sp = await searchParams;

  const croId = p.id ?? p.croId;
  const projectId = Array.isArray(sp.projectId) ? sp.projectId[0] : sp.projectId;

  if (!croId || !isUuid(croId)) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <ErrorCard message="CRO not found." />
        </div>
      </main>
    );
  }

  const { data: cro, error } = await supabaseAdmin
    .from("cros")
    .select("id,owner,name,website,country,contact_email,specialties")
    .eq("id", croId)
    .single();

  if (error || !cro) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <ErrorCard message="CRO not found." />
        </div>
      </main>
    );
  }

  // Check if current user owns this CRO (read-only cookies to avoid mutation)
  const sb = await getServerSupabaseReadOnly();
  const { data: { user } } = await sb.auth.getUser().catch(() => ({ data: { user: null } as any }));
  const isOwner = user?.id && user.id === cro.owner;

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
      {/* Hero / Banner */}
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">CRO Profile</div>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{cro.name}</h1>
              {cro.country && (
                <p className="mt-1 text-sm text-white/90">{cro.country}</p>
              )}
            </div>
            <div className="flex gap-2">
              <BackButton projectId={projectId} />
              {isOwner ? (
                <Link
                  href="/cros/me"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  My dashboard
                </Link>
              ) : cro.website ? (
                <a
                  href={cro.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
                >
                  Visit website →
                </a>
              ) : null}
            </div>
          </div>
        </div>
        {/* Molecule decoration */}
        <svg className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 opacity-20" viewBox="0 0 200 200">
          <g fill="none" stroke="white" strokeWidth="2">
            <circle cx="100" cy="20" r="8" /><circle cx="160" cy="60" r="6" /><circle cx="40" cy="60" r="6" /><circle cx="100" cy="100" r="10" />
            <path d="M100 20C100 60 40 60 40 60M100 20C100 60 160 60 160 60M40 60C60 100 60 140 60 140M160 60C140 100 140 140 140 140M60 140C100 170 140 140 140 140" />
          </g>
        </svg>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Left: Details */}
          <section className="md:col-span-7 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold tracking-wide text-slate-900">Overview</h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
              {cro.website && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Website</dt>
                  <dd className="mt-1">
                    <a
                      className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                      href={cro.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {cro.website}
                    </a>
                  </dd>
                </div>
              )}
              {cro.contact_email && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Contact email</dt>
                  <dd className="mt-1 font-medium text-slate-900">{cro.contact_email}</dd>
                </div>
              )}
              {cro.country && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Country</dt>
                  <dd className="mt-1 font-medium text-slate-900">{cro.country}</dd>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Specialties</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {(cro.specialties ?? []).length ? (
                    (cro.specialties as string[]).map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </dd>
              </div>
            </dl>

            {isOwner && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                You’re viewing your public profile.{" "}
                <Link href="/cros/me" className="font-medium underline underline-offset-4">
                  Go to your CRO dashboard →
                </Link>
              </div>
            )}
          </section>

          {/* Right: Contact + Visit tracking */}
          <aside className="md:col-span-5 grid gap-6">
            {!isOwner && (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <h2 className="text-lg font-semibold tracking-wide text-slate-900">Connect</h2>
                <ContactBox
                  croId={cro.id}
                  projectId={projectId as string | undefined}
                  contactEmail={cro.contact_email}
                />
              </div>
            )}

            {/* Small compliance/assurance block */}
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600 shadow-sm backdrop-blur">
              SOC 2-ready • HIPAA-aware • GDPR-aligned
            </div>

            {!isOwner && (
              <VisitTracker croId={cro.id} projectId={projectId as string | undefined} />
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ---------- Small UI helpers ---------- */

function BackButton({ projectId }: { projectId?: string }) {
  const href = projectId ? `/matches?projectId=${encodeURIComponent(projectId)}` : "/";
  return (
    <Link
      href={href}
      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
    >
      ← Back
    </Link>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
      <h2 className="text-lg font-semibold">Error</h2>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
