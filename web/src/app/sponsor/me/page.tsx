// import Link from "next/link";
// import { cookies } from "next/headers";
// import { createServerClient } from "@supabase/ssr";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";
// import SignOutButton from "@/app/_components/SignOutButton";

// type ProjectRow = {
//   id: string;
//   title: string;
//   created_at: string; // ISO string from Supabase
// };

// type ReplyRow = {
//   id: string;
//   sender: string;        // user_profiles.id (uuid)
//   project_id: string;    // projects.id (uuid)
//   message: string;
//   sent_at: string;       // ISO string
// };


// export const dynamic = "force-dynamic";

// // Read-only cookies adapter for Server Components (prevents Next 15 cookie write error)
// async function getServerSupabase() {
//   const jar = await cookies();
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll: () => jar.getAll(),
//         setAll: () => {}, // <- important: no writes in RSC
//       },
//     }
//   );
// }

// export default async function SponsorMe() {
//   const sb = await getServerSupabase();
//   const {
//     data: { user },
//   } = await sb.auth.getUser();

//   if (!user) {
//     return (
//       <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
//         <div className="mx-auto max-w-3xl px-6 py-14">
//           <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
//             <h1 className="text-xl font-semibold text-slate-900">You’re not signed in</h1>
//             <p className="mt-1 text-slate-600">Access your Sponsor workspace to manage projects and threads.</p>
//             <Link
//               href="/auth?role=sponsor&mode=login"
//               className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
//             >
//               Sign in
//             </Link>
//           </div>
//         </div>
//       </main>
//     );
//   }

//   const uid = user.id;

//   // Profile (RLS-friendly)
//   const { data: profile } = await sb
//     .from("user_profiles")
//     .select("full_name,email,role")
//     .eq("id", uid)
//     .single();

//   // Stats & lists (admin client to bypass RLS for convenience)
//   const [
//     projectsCountRes,
//     sentInquiriesRes,
//     unreadRepliesRes,
//     projectsRes,
//     repliesRes,
//     latestThreadRes, // 👈 NEW: latest chat thread for this user (either direction)
//   ] = await Promise.all([
//     supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("owner", uid),
//     supabaseAdmin.from("contacts").select("*", { count: "exact", head: true }).eq("sender", uid),
//     supabaseAdmin
//       .from("contacts")
//       .select("*", { count: "exact", head: true })
//       .eq("recipient", uid)
//       .is("read_at", null),
//     supabaseAdmin
//       .from("projects")
//       .select("id,title,created_at")
//       .eq("owner", uid)
//       .order("created_at", { ascending: false }),
//     supabaseAdmin
//       .from("contacts")
//       .select("id,sender,recipient,project_id,message,sent_at,read_at")
//       .eq("recipient", uid)
//       .order("sent_at", { ascending: false })
//       .limit(20),
//     // latest thread regardless of direction
//     supabaseAdmin
//       .from("contacts")
//       .select("project_id,sender,recipient,sent_at")
//       .or(`sender.eq.${uid},recipient.eq.${uid}`)
//       .order("sent_at", { ascending: false })
//       .limit(1)
//       .maybeSingle(),
//   ]);

//   const projects = projectsRes.data ?? [];
//   const replies = repliesRes.data ?? [];
//   const projectsCount = projectsCountRes.count ?? 0;
//   const sentInquiries = sentInquiriesRes.count ?? 0;
//   const unreadReplies = unreadRepliesRes.count ?? 0;

  

//   // Enrich replies: who sent + CRO name + project title
//   const senderIds = Array.from(new Set(replies.map((r) => r.sender).filter(Boolean) as string[]));
//   const projectIds = Array.from(new Set(replies.map((r) => r.project_id).filter(Boolean) as string[]));

//   const [sendersRes, crosRes, projectTitlesRes] = await Promise.all([
//     supabaseAdmin.from("user_profiles").select("id,full_name,email").in("id", senderIds),
//     supabaseAdmin.from("cros").select("id,name,owner").in("owner", senderIds),
//     supabaseAdmin.from("projects").select("id,title").in("id", projectIds),
//   ]);

//   const senders = new Map((sendersRes.data ?? []).map((u) => [u.id, u]));
//   const croByOwner = new Map((crosRes.data ?? []).map((c) => [c.owner, c]));
//   const projTitle = new Map((projectTitlesRes.data ?? []).map((p) => [p.id, p.title]));

//   // 👇 Build the latest chat deep-link (if any)
//   const latest = latestThreadRes.data as
//     | { project_id: string; sender: string | null; recipient: string | null; sent_at: string }
//     | null;

//   const latestChat =
//     latest && latest.project_id && (latest.sender || latest.recipient)
//       ? {
//           projectId: latest.project_id,
//           otherUserId: latest.sender === uid ? latest.recipient : latest.sender,
//         }
//       : null;

//   return (
//     <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
//       {/* Top banner (distinct accent from CRO: indigo→sky) */}
//       <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white">
//         <div className="mx-auto max-w-6xl px-6 py-10">
//           <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//             <div>
//               <div className="text-xs uppercase tracking-wider text-white/80">Sponsor Workspace</div>
//               <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
//                 {profile?.full_name ?? "Sponsor"}
//               </h1>
//               <p className="mt-1 text-sm text-white/90">
//                 Manage projects, review CRO replies, and move your study forward.
//               </p>
//             </div>
//             <div className="flex flex-wrap gap-2">
//               <Link
//                 href="/projects/new"
//                 className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
//               >
//                 + New Project
//               </Link>

//               <Link
//                 href="/sponsor/edit"
//                 className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
//               >
//                 Edit profile
//               </Link>

//               {/* Optional sign out */}
//               {typeof SignOutButton !== "undefined" && (
//                 <SignOutButton className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20" />
//               )}
//             </div>
//           </div>
//         </div>
//         {/* decorative molecules */}
//         <svg className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 opacity-20" viewBox="0 0 200 200">
//           <g fill="none" stroke="white" strokeWidth="2">
//             <circle cx="100" cy="20" r="8" />
//             <circle cx="160" cy="60" r="6" />
//             <circle cx="40" cy="60" r="6" />
//             <circle cx="100" cy="100" r="10" />
//             <path d="M100 20C100 60 40 60 40 60M100 20C100 60 160 60 160 60M40 60C60 100 60 140 60 140M160 60C140 100 140 140 140 140M60 140C100 170 140 140 140 140" />
//           </g>
//         </svg>
//       </div>

//       {/* Body */}
//       <div className="mx-auto max-w-6xl px-6 py-8">
//         {/* Profile card */}
//         <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
//           <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur md:col-span-2">
//             <h2 className="text-sm font-semibold tracking-wide text-slate-900">Profile</h2>
//             <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
//               <div className="rounded-xl border border-slate-200 bg-white p-3">
//                 <dt className="text-[11px] uppercase tracking-wide text-slate-500">Full name</dt>
//                 <dd className="mt-1 font-medium text-slate-900">
//                   {profile?.full_name ?? "—"}
//                 </dd>
//               </div>
//               <div className="rounded-xl border border-slate-200 bg-white p-3">
//                 <dt className="text-[11px] uppercase tracking-wide text-slate-500">Email</dt>
//                 <dd className="mt-1 font-medium text-slate-900">{profile?.email ?? "—"}</dd>
//               </div>
//               <div className="rounded-xl border border-slate-200 bg-white p-3">
//                 <dt className="text-[11px] uppercase tracking-wide text-slate-500">Role</dt>
//                 <dd className="mt-1 font-medium text-slate-900">{profile?.role ?? "sponsor"}</dd>
//               </div>
//               <div className="rounded-xl border border-slate-200 bg-white p-3">
//                 <dt className="text-[11px] uppercase tracking-wide text-slate-500">Latest activity</dt>
//                 <dd className="mt-1 font-medium text-slate-900">
//                   {replies[0]?.sent_at ? new Date(replies[0].sent_at).toLocaleString() : "—"}
//                 </dd>
//               </div>
//             </dl>
//           </div>

//           {/* Quick actions */}
//           <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
//             <h2 className="text-sm font-semibold tracking-wide text-slate-900">Quick actions</h2>
//             <div className="mt-3 grid gap-2">
//               <Action href="/projects/new" label="Create new project" sub="Kick off a new RFP" />

//               {latestChat && latestChat.otherUserId ? (
//                 <Action
//                   href={`/chat/${latestChat.projectId}/${latestChat.otherUserId}`}
//                   label="Open message center"
//                   sub="Continue your latest conversation"
//                 />
//               ) : (
//                 <Action
//                   href="/messages"
//                   label="Open message center"
//                   sub="No active chats yet"
//                 />
//               )}
//             </div>
//           </div>
//         </section>

//         {/* Stats */}
//         <section className="mt-6">
//           <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
//             <Stat label="Projects" value={projectsCount} accent="from-indigo-500 to-sky-500" />
//             <Stat label="Inquiries sent" value={sentInquiries} accent="from-cyan-500 to-teal-500" />
//             <Stat label="Unread replies" value={unreadReplies} accent="from-amber-500 to-orange-500" />
//             <Stat
//               label="Latest activity"
//               value={replies[0]?.sent_at ? new Date(replies[0].sent_at).toLocaleDateString() : "—"}
//               accent="from-fuchsia-500 to-pink-500"
//             />
//           </div>
//         </section>

//         {/* Projects */}
//         <section className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
//           <div className="flex items-center justify-between">
//             <h2 className="text-sm font-semibold tracking-wide text-slate-900">Your projects</h2>
//             <Link
//               href="/projects/new"
//               className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
//             >
//               + New
//             </Link>
//           </div>

//           {projects.length === 0 ? (
//             <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
//               No projects yet.{" "}
//               <Link href="/projects/new" className="font-medium text-indigo-700 underline underline-offset-4">
//                 Create your first project →
//               </Link>
//             </div>
//           ) : (
//             <ul className="mt-3 space-y-2">
//           {(projects as ProjectRow[]).map((p) => (
//             <li
//               key={p.id}
//               className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm"
//             >
//               <div>
//                 <div className="font-medium text-slate-900">{p.title}</div>
//                 <div className="text-xs text-slate-500">
//                   {new Date(p.created_at).toLocaleString()}
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <Link
//                   className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-900 hover:bg-slate-50"
//                   href={`/matches?projectId=${p.id}`}
//                 >
//                   See matches
//                 </Link>
//                 {/* Keep/grow this as you like */}
//                 <Link
//                   className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-900 hover:bg-slate-50"
//                   href="/messages"
//                 >
//                   Open threads
//                 </Link>
//               </div>
//             </li>
//           ))}
//         </ul>

//           )}
//         </section>

//         {/* Replies from CROs */}
//         <section className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
//           <div className="flex items-center justify-between">
//             <h2 className="text-sm font-semibold tracking-wide text-slate-900">Recent replies from CROs</h2>
//             <div className="text-xs text-slate-600">{replies.length} shown</div>
//           </div>

//           {replies.length === 0 ? (
//             <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
//               No replies yet.
//             </div>
//           ) : (
//             <ul className="mt-3 space-y-2">
//           {(replies as ReplyRow[]).map((m) => {
//             const s    = senders.get(m.sender);
//             const cro  = croByOwner.get(m.sender);
//             const title = projTitle.get(m.project_id) ?? "Untitled project";
//             return (
//               <li key={m.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
//                 <div className="text-sm text-slate-800">
//                   <span className="font-medium">{cro?.name ?? s?.full_name ?? "CRO"}</span>{" "}
//                   replied on <span className="italic">{title}</span>
//                 </div>
//                 <div className="mt-1 text-sm text-slate-700">{m.message}</div>
//                 <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
//                   <time dateTime={new Date(m.sent_at).toISOString()}>
//                     {new Date(m.sent_at).toLocaleString()}
//                   </time>
//                   <Link
//                     href={`/chat/${m.project_id}/${m.sender}`}
//                     className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-900"
//                   >
//                     Open chat
//                   </Link>
//                 </div>
//               </li>
//             );
//           })}
//         </ul>

//           )}
//         </section>

//         {/* Footer tone bar */}
//         <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-slate-600">
//           <div className="rounded-xl border bg-white/70 p-2 text-center">SOC 2-ready</div>
//           <div className="rounded-xl border bg-white/70 p-2 text-center">HIPAA-aware</div>
//           <div className="rounded-xl border bg-white/70 p-2 text-center">GDPR-aligned</div>
//         </div>
//       </div>
//     </main>
//   );
// }

// /* ---------- Reusable UI bits ---------- */

// function Stat({
//   label,
//   value,
//   accent = "from-indigo-500 to-sky-500",
// }: {
//   label: string;
//   value: number | string;
//   accent?: string;
// }) {
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
//       <div className={`inline-flex items-center rounded-lg bg-gradient-to-r ${accent} px-2 py-1 text-xs font-medium text-white`}>
//         {label}
//       </div>
//       <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
//       <div className="text-xs text-slate-600">Last 30 days</div>
//     </div>
//   );
// }

// function Action({
//   href,
//   label,
//   sub,
//   external,
// }: {
//   href: string;
//   label: string;
//   sub?: string;
//   external?: boolean;
// }) {
//   return (
//     <Link
//       href={href}
//       target={external ? "_blank" : undefined}
//       rel={external ? "noreferrer" : undefined}
//       className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50"
//     >
//       <div>
//         <div className="font-medium">{label}</div>
//         {sub && <div className="text-xs text-slate-600">{sub}</div>}
//       </div>
//       <svg
//         viewBox="0 0 24 24"
//         className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//       >
//         <path d="M5 12h14M13 6l6 6-6 6" />
//       </svg>
//     </Link>
//   );
// }


import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import SignOutButton from "@/app/_components/SignOutButton";

type ProjectRow = {
  id: string;
  title: string;
  created_at: string;
};

type ReplyRow = {
  id: string;
  sender: string;
  project_id: string;
  message: string;
  sent_at: string;
};

export const dynamic = "force-dynamic";

async function getServerSupabase() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: () => {}, // <- RSC: no writes
      },
    }
  );
}

export default async function SponsorMe() {
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
            <p className="mt-1 text-slate-600">
              Access your Sponsor workspace to manage projects and threads.
            </p>
            <Link
              href="/auth?role=sponsor&mode=login"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const uid = user.id;

  // Profile
  const { data: profile } = await sb
    .from("user_profiles")
    .select("full_name,email,role")
    .eq("id", uid)
    .single();

  // Stats & lists
  const [
    projectsCountRes,
    sentInquiriesRes,
    unreadRepliesRes,
    projectsRes,
    repliesRes,
    latestThreadRes,
  ] = await Promise.all([
    supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("owner", uid),
    supabaseAdmin.from("contacts").select("*", { count: "exact", head: true }).eq("sender", uid),
    supabaseAdmin
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("recipient", uid)
      .is("read_at", null),
    supabaseAdmin
      .from("projects")
      .select("id,title,created_at")
      .eq("owner", uid)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("contacts")
      .select("id,sender,recipient,project_id,message,sent_at,read_at")
      .eq("recipient", uid)
      .order("sent_at", { ascending: false })
      .limit(5), // ✅ only latest 5
    supabaseAdmin
      .from("contacts")
      .select("project_id,sender,recipient,sent_at")
      .or(`sender.eq.${uid},recipient.eq.${uid}`)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const projects = projectsRes.data ?? [];
  const replies = repliesRes.data ?? [];
  const projectsCount = projectsCountRes.count ?? 0;
  const sentInquiries = sentInquiriesRes.count ?? 0;
  const unreadReplies = unreadRepliesRes.count ?? 0;

  // Enrich replies
  const senderIds = Array.from(new Set(replies.map((r) => r.sender).filter(Boolean) as string[]));
  const projectIds = Array.from(new Set(replies.map((r) => r.project_id).filter(Boolean) as string[]));

  const [sendersRes, crosRes, projectTitlesRes] = await Promise.all([
    supabaseAdmin.from("user_profiles").select("id,full_name,email").in("id", senderIds),
    supabaseAdmin.from("cros").select("id,name,owner").in("owner", senderIds),
    supabaseAdmin.from("projects").select("id,title").in("id", projectIds),
  ]);

  const senders = new Map((sendersRes.data ?? []).map((u) => [u.id, u]));
  const croByOwner = new Map((crosRes.data ?? []).map((c) => [c.owner, c]));
  const projTitle = new Map((projectTitlesRes.data ?? []).map((p) => [p.id, p.title]));

  const latest = latestThreadRes.data as
    | { project_id: string; sender: string | null; recipient: string | null; sent_at: string }
    | null;

  const latestChat =
    latest && latest.project_id && (latest.sender || latest.recipient)
      ? {
          projectId: latest.project_id,
          otherUserId: latest.sender === uid ? latest.recipient : latest.sender,
        }
      : null;

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
      {/* Top banner */}
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">Sponsor Workspace</div>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
                {profile?.full_name ?? "Sponsor"}
              </h1>
              <p className="mt-1 text-sm text-white/90">
                Manage projects, review CRO replies, and move your study forward.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/projects/new"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                + New Project
              </Link>
              <Link
                href="/sponsor/edit"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
              >
                Edit profile
              </Link>
              {typeof SignOutButton !== "undefined" && (
                <SignOutButton className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Profile card + Quick actions */}
        {/* ... your existing profile/quick actions code unchanged ... */}

        {/* Stats */}
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Projects" value={projectsCount} accent="from-indigo-500 to-sky-500" />
            <Stat label="Inquiries sent" value={sentInquiries} accent="from-cyan-500 to-teal-500" />
            <Stat label="Unread replies" value={unreadReplies} accent="from-amber-500 to-orange-500" />
            <Stat
              label="Latest activity"
              value={replies[0]?.sent_at ? new Date(replies[0].sent_at).toLocaleDateString() : "—"}
              accent="from-fuchsia-500 to-pink-500"
            />
          </div>
        </section>

        {/* Projects */}
        {/* ... keep your Projects section unchanged ... */}

        {/* ✅ Replies from CROs (scrollable card, top 5) */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-0 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-slate-900">
              Recent replies from CROs
            </h2>
            <div className="text-xs text-slate-600">{replies.length} shown</div>
          </div>

          {replies.length === 0 ? (
            <div className="px-6 py-4">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No replies yet.
              </div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto px-6 py-4">
              <ul className="space-y-2">
                {(replies as ReplyRow[]).map((m) => {
                  const s = senders.get(m.sender);
                  const cro = croByOwner.get(m.sender);
                  const title = projTitle.get(m.project_id) ?? "Untitled project";
                  return (
                    <li
                      key={m.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="text-sm text-slate-800">
                        <span className="font-medium">
                          {cro?.name ?? s?.full_name ?? "CRO"}
                        </span>{" "}
                        replied on <span className="italic">{title}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-700 line-clamp-3">{m.message}</div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <time dateTime={new Date(m.sent_at).toISOString()}>
                          {new Date(m.sent_at).toLocaleString()}
                        </time>
                        <Link
                          href={`/chat/${m.project_id}/${m.sender}`}
                          className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-900"
                        >
                          Open chat
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
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

/* ---------- Reusable UI bits ---------- */

function Stat({
  label,
  value,
  accent = "from-indigo-500 to-sky-500",
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div
        className={`inline-flex items-center rounded-lg bg-gradient-to-r ${accent} px-2 py-1 text-xs font-medium text-white`}
      >
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

