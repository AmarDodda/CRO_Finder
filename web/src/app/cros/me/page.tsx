// // web/src/app/cros/me/page.tsx
// import { supabaseAdmin } from "@/lib/supabaseAdmin";
// import { cookies } from "next/headers";
// import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

// export const dynamic = "force-dynamic";

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

// export default async function CroMe() {
//   const sb = await getServerSupabase();
//   const { data: { user } } = await sb.auth.getUser();
//   if (!user) {
//     return (
//       <div className="p-6">
//         You’re not signed in. <a className="underline" href="/auth?role=cro">Sign in</a>
//       </div>
//     );
//   }

//   // Find CRO owned by this user (latest if multiple)
//   const { data: cro } = await sb
//     .from("cros")
//     .select("id,name,website,country,contact_email,specialties,created_at")
//     .eq("owner", user.id)
//     .order("created_at", { ascending: false })
//     .limit(1)
//     .maybeSingle();

//   if (!cro) {
//     // No CRO yet ⇒ send to onboarding
//     return (
//       <div className="p-6">
//         No CRO profile found. <a className="underline" href="/cros/new">Create one now</a>.
//       </div>
//     );
//   }

//   // Server-side stats (admin client to skip RLS hassles)
//   const croId = cro.id as string;

//  const [
//   viewsCountRes,
//   viewersRowsRes,
//   inquiriesRes,
//   unreadRes,
//   recentMsgsRes,
// ] = await Promise.all([
//   // total views (cheap head+count)
//   supabaseAdmin
//     .from("notifications")
//     .select("*", { count: "exact", head: true })
//     .eq("type", "visit")
//     .eq("cro_id", croId),

//   // fetch actors and dedupe in JS for distinct viewer count
//   supabaseAdmin
//     .from("notifications")
//     .select("actor")
//     .eq("type", "visit")
//     .eq("cro_id", croId)
//     .not("actor", "is", null) // ignore null actors
//     .limit(10000), // adjust if you expect more

//   // total inquiries to this CRO (head+count)
//   supabaseAdmin
//     .from("contacts")
//     .select("*", { count: "exact", head: true })
//     .eq("recipient", user.id),

//   // unread inquiries (head+count)
//   supabaseAdmin
//     .from("contacts")
//     .select("*", { count: "exact", head: true })
//     .eq("recipient", user.id)
//     .is("read_at", null),

//   // recent messages
//   supabaseAdmin
//     .from("contacts")
//     .select("id,sender,recipient,project_id,message,sent_at,read_at")
//     .eq("recipient", user.id)
//     .order("sent_at", { ascending: false })
//     .limit(10),
// ]);

// const views = viewsCountRes.count ?? 0;
// const uniqueViewers = new Set(
//   (viewersRowsRes.data ?? [])
//     .map(r => r.actor as string | null)
//     .filter(Boolean)
// ).size;

// const inquiries = inquiriesRes.count ?? 0;
// const unread = unreadRes.count ?? 0;
// const recent = recentMsgsRes.data ?? [];

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold">My CRO</h1>
//         <a
//           className="underline text-sm"
//           href={`/cros/${cro.id}`}
//           target="_blank"
//           rel="noreferrer"
//         >
//           Preview public profile →
//         </a>
//       </div>

//       {/* Basic profile block */}
//       <div className="border rounded p-4 bg-white">
//         <div className="text-lg font-medium">{cro.name}</div>
//         <div className="text-sm text-gray-700 mt-1 space-y-1">
//           {cro.country && <div><b>Country:</b> {cro.country}</div>}
//           {cro.website && (
//             <div>
//               <b>Website:</b>{" "}
//               <a className="underline" href={cro.website} target="_blank" rel="noreferrer">
//                 {cro.website}
//               </a>
//             </div>
//           )}
//           {cro.contact_email && <div><b>Contact Email:</b> {cro.contact_email}</div>}
//           {cro.specialties?.length ? (
//             <div><b>Specialties:</b> {cro.specialties.join(", ")}</div>
//           ) : null}
//         </div>
//         <div className="mt-3">
//           <a className="border px-3 py-1 rounded" href={`/cros/${cro.id}/edit`}>Edit profile</a>
//         </div>
//       </div>

//       {/* Metrics */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         <Stat label="Profile views" value={views} />
//         <Stat label="Unique viewers" value={uniqueViewers} />
//         <Stat label="Inquiries" value={inquiries} />
//         <Stat label="Unread messages" value={unread} />
//       </div>

//       {/* Recent inquiries */}
//       <div className="border rounded p-4 bg-white">
//         <div className="text-lg font-medium">Recent inquiries</div>
//         <div className="mt-2 space-y-2">
//           {recent.length === 0 && <div className="text-sm text-gray-500">No messages yet.</div>}
//           {recent.map((m) => (
//             <div key={m.id} className="border rounded p-3">
//               <div className="text-sm text-gray-700">
//                 {m.message}
//               </div>
//               <div className="text-[11px] text-gray-500 mt-1">
//                 {new Date(m.sent_at).toLocaleString()} •{" "}
//                 <a
//                   className="underline"
//                   href={`/chat/${m.project_id}/${m.sender}`}
//                 >
//                   Open chat
//                 </a>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function Stat({ label, value }: { label: string; value: number | string }) {
//   return (
//     <div className="border rounded p-4 bg-white">
//       <div className="text-2xl font-semibold">{value}</div>
//       <div className="text-sm text-gray-600">{label}</div>
//     </div>
//   );
// }


// web/src/app/cros/me/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import SignOutButton from "@/app/_components/SignOutButton"; // ⬅️ add this import

export const dynamic = "force-dynamic";

async function getServerSupabase() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Read-only cookie adapter for Server Components
      cookies: {
        getAll: () => jar.getAll(),
        // No-ops to satisfy the interface without writing cookies in RSC
        setAll: () => {},  // <-- important: prevent writes
      },
    }
  );
}


export default async function CroMe() {
  const sb = await getServerSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
            <h1 className="text-xl font-semibold text-slate-900">You’re not signed in</h1>
            <p className="mt-1 text-slate-600">Access your CRO workspace to manage your profile and inquiries.</p>
            <Link
              href="/auth?role=cro&mode=login"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Find CRO owned by this user (latest if multiple)
  const { data: cro } = await sb
    .from("cros")
    .select("id,name,website,country,contact_email,specialties,created_at")
    .eq("owner", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cro) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
            <h1 className="text-xl font-semibold text-slate-900">No CRO profile found</h1>
            <p className="mt-1 text-slate-600">Create your CRO profile to start receiving qualified sponsor inquiries.</p>
            <Link
              href="/cros/new"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Create profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Server-side stats (admin client)
  const croId = cro.id as string;

  const [
    viewsCountRes,
    viewersRowsRes,
    inquiriesRes,
    unreadRes,
    recentMsgsRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("type", "visit")
      .eq("cro_id", croId),

    supabaseAdmin
      .from("notifications")
      .select("actor")
      .eq("type", "visit")
      .eq("cro_id", croId)
      .not("actor", "is", null)
      .limit(10000),

    supabaseAdmin
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("recipient", user.id),

    supabaseAdmin
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("recipient", user.id)
      .is("read_at", null),

    supabaseAdmin
      .from("contacts")
      .select("id,sender,recipient,project_id,message,sent_at,read_at")
      .eq("recipient", user.id)
      .order("sent_at", { ascending: false })
      .limit(10),
  ]);

  const views = viewsCountRes.count ?? 0;
  const uniqueViewers = new Set(
    (viewersRowsRes.data ?? [])
      .map((r) => r.actor as string | null)
      .filter(Boolean)
  ).size;

  const inquiries = inquiriesRes.count ?? 0;
  const unread = unreadRes.count ?? 0;
  const recent = recentMsgsRes.data ?? [];

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
      {/* Top banner */}
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">CRO Workspace</div>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{cro.name}</h1>
              <p className="mt-1 text-sm text-white/90">
                Manage your public profile, track sponsor interest, and respond to inquiries.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/cros/${cro.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
              >
                Preview public profile →
              </Link>
              {/* Header actions — replace the Edit link href */}
                <Link
                href={`/cros/${cro.id}/edit`}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                Edit profile
                </Link>

                <SignOutButton className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20" />

            </div>
          </div>
        </div>
        {/* decorative molecules */}
        <svg className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 opacity-20" viewBox="0 0 200 200">
          <g fill="none" stroke="white" strokeWidth="2">
            <circle cx="100" cy="20" r="8" />
            <circle cx="160" cy="60" r="6" />
            <circle cx="40" cy="60" r="6" />
            <circle cx="100" cy="100" r="10" />
            <path d="M100 20C100 60 40 60 40 60M100 20C100 60 160 60 160 60M40 60C60 100 60 140 60 140M160 60C140 100 140 140 140 140M60 140C100 170 140 140 140 140" />
          </g>
        </svg>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Profile overview */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur md:col-span-2">
            <h2 className="text-sm font-semibold tracking-wide text-slate-900">Profile</h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
              {cro.country && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Country</dt>
                  <dd className="mt-1 font-medium text-slate-900">{cro.country}</dd>
                </div>
              )}
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
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Specialties</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {(cro.specialties ?? []).length ? (
                    (cro.specialties as string[]).map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold tracking-wide text-slate-900">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              <Action href={`/cros/${cro.id}/edit`} label="Update capabilities" sub="Keep your TA/phase/site data fresh" />
              <Action href={`/cros/${cro.id}`} label="Share public profile" sub="Open your live profile in a new tab" external />
              <Action href={`/projects/explore`} label="Browse open RFPs" sub="See active sponsor needs" />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Profile views" value={views} accent="from-sky-500 to-cyan-500" />
            <Stat label="Unique viewers" value={uniqueViewers} accent="from-violet-500 to-fuchsia-500" />
            <Stat label="Inquiries" value={inquiries} accent="from-emerald-500 to-teal-500" />
            <Stat label="Unread messages" value={unread} accent="from-amber-500 to-orange-500" />
          </div>
        </section>

        {/* Recent inquiries */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-900">Recent inquiries</h2>
            <div className="text-xs text-slate-600">{recent.length} shown</div>
          </div>
          <div className="mt-3 space-y-3">
            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No messages yet.
              </div>
            ) : (
              recent.map((m) => (
                <article key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-800">{m.message}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <time dateTime={new Date(m.sent_at).toISOString()}>
                      {new Date(m.sent_at).toLocaleString()}
                    </time>
                    <Link
                      href={`/chat/${m.project_id}/${m.sender}`}
                      className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                    >
                      Open chat
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Footer tone bar */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="rounded-xl border bg-white/70 p-2 text-center">SOC 2-ready</div>
          <div className="rounded-xl border bg-white/70 p-2 text-center">HIPAA-aware</div>
          <div className="rounded-xl border bg-white/70 p-2 text-center">GDPR-aligned</div>
        </div>
      </div>
    </main>
  );
}

/* ---------- UI bits (server-safe, no client hooks) ---------- */

function Stat({
  label,
  value,
  accent = "from-sky-500 to-cyan-500",
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className={`inline-flex items-center rounded-lg bg-gradient-to-r ${accent} px-2 py-1 text-xs font-medium text-white`}>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-600">Last 30 days</div>
    </div>
  );
}

function Action({
  href,
  label,
  sub,
  external,
}: {
  href: string;
  label: string;
  sub?: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50"
    >
      <div>
        <div className="font-medium">{label}</div>
        {sub && <div className="text-xs text-slate-600">{sub}</div>}
      </div>
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
