// "use client";
// import { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import { useSearchParams } from "next/navigation";

// type Result = {
//   cro_id: string;
//   cro_user_id: string | null;
//   name: string;
//   website: string | null;
//   country: string | null;
//   contact_email: string | null;
//   specialties: string[] | null;
//   similarity: number;
//   rationale: string;
// };

// export default function Matches() {
//   const searchParams = useSearchParams();
//   const projectId = searchParams.get("projectId") || undefined;

//   const [data, setData] = useState<{ project_id: string; results: Result[] } | null>(null);
//   const [err, setErr] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     (async () => {
//       if (!projectId) return;
//       try {
//         setLoading(true);
//         setErr(null);
//         const r = await fetch("/api/match-project", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ project_id: projectId, k: 10 }),
//         });
//         const j = await r.json();
//         if (!r.ok) throw new Error(j.error ?? "Failed to load matches");
//         setData(j);
//       } catch (e: any) {
//         setErr(e.message ?? "Error");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [projectId]);

//   // Deduplicate by cro_id to ensure unique keys
//   const dedupedResults = useMemo(() => {
//     if (!data?.results?.length) return [];
//     const seen = new Set<string>();
//     const out: Result[] = [];
//     for (const r of data.results) {
//       if (r?.cro_id && !seen.has(r.cro_id)) {
//         seen.add(r.cro_id);
//         out.push(r);
//       } else if (!r?.cro_id) {
//         // keep rows without an id but avoid blowing up
//         out.push(r);
//       }
//     }
//     return out;
//   }, [data]);

//   if (!projectId) return <div className="p-6">Missing <code>projectId</code>.</div>;
//   if (err) return <div className="p-6 text-red-600">{err}</div>;
//   if (loading || !data) return <div className="p-6">Loading…</div>;
//   if (dedupedResults.length === 0) {
//     return (
//       <div className="max-w-3xl mx-auto p-6 space-y-3">
//         <h1 className="text-2xl font-semibold">Matches</h1>
//         <p>No CROs matched this project yet. Try broadening filters or adding more CROs.</p>
//         <div className="flex gap-2">
//           <Link className="border px-3 py-1 rounded" href="/projects/new">New Project</Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-4">
//       <h1 className="text-2xl font-semibold">Matches</h1>
//       <ul className="space-y-3">
//         {dedupedResults.map((r, i) => {
//           // Stable, unique key: prefer cro_id; fall back to composite; ensure uniqueness with index suffix
//           const key = r.cro_id || `${r.name}|${r.contact_email || "no-email"}|${i}`;
//           return (
//             <li key={key} className="border rounded p-4">
//               <div className="flex items-center justify-between">
//                 <Link
//                   className="text-lg font-medium underline"
//                   href={`/cros/${encodeURIComponent(r.cro_id)}?projectId=${encodeURIComponent(data.project_id)}`}
//                 >
//                   {r.name}
//                 </Link>
//                 <span className="text-sm">{Math.round((r.similarity ?? 0) * 100)}% match</span>
//               </div>

//               <div className="text-sm text-gray-700 mt-1">
//                 {r.country ? <>Country: {r.country} • </> : null}
//                 {Array.isArray(r.specialties) && r.specialties.length > 0
//                   ? <>Specialties: {r.specialties.join(", ")}</>
//                   : null}
//               </div>
//               {r.rationale ? <div className="text-sm mt-2 italic">{r.rationale}</div> : null}

//               <div className="mt-3 flex flex-wrap gap-2">
//                 <Link
//                   className="border px-3 py-1 rounded"
//                   href={`/cros/${encodeURIComponent(r.cro_id)}?projectId=${encodeURIComponent(data.project_id)}`}
//                 >
//                   View Profile
//                 </Link>
//                 {r.cro_user_id && (
//                   <Link
//                     className="border px-3 py-1 rounded"
//                     href={`/chat/${encodeURIComponent(data.project_id)}/${encodeURIComponent(r.cro_user_id)}`}
//                   >
//                     Chat
//                   </Link>
//                 )}
//                 {r.contact_email && (
//                   <a className="border px-3 py-1 rounded" href={`mailto:${r.contact_email}`}>
//                     Email
//                   </a>
//                 )}
//                 {r.website && (
//                   <a
//                     className="border px-3 py-1 rounded"
//                     href={r.website}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                   >
//                     Website
//                   </a>
//                 )}
//               </div>
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }


"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Result = {
  cro_id: string;
  cro_user_id: string | null;
  name: string;
  website: string | null;
  country: string | null;
  contact_email: string | null;
  specialties: string[] | null;
  similarity: number;
  rationale: string;
};

type ApiResponse = { project_id: string; results: Result[] };

export default function Matches() {
  const sp = useSearchParams();
  const projectId = sp.get("projectId") || undefined;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // UI state
  const [q, setQ] = useState("");
  const [minSim, setMinSim] = useState(0.5);
  const [sort, setSort] = useState<"best" | "name" | "country">("best");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch("/api/match-project", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId, k: 18 }), // fetch a few more for filtering
        });
        const j = (await r.json()) as ApiResponse & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load matches");
        setData(j);
      } catch (e: any) {
        setErr(e.message ?? "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // Deduplicate by cro_id
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    const out: Result[] = [];
    for (const r of data?.results ?? []) {
      const id = r?.cro_id ?? `${r.name}|${r.contact_email || ""}`;
      if (!seen.has(id)) {
        seen.add(id);
        out.push(r);
      }
    }
    return out;
  }, [data]);

  // Build facets (specialties) from results
  const allSpecs = useMemo(() => {
    const s = new Set<string>();
    for (const r of deduped) (r.specialties ?? []).forEach((x) => x && s.add(x));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [deduped]);
  const [activeSpecs, setActiveSpecs] = useState<string[]>([]);

  // Apply filters
  const filtered = useMemo(() => {
    let list = deduped.filter((r) => (r.similarity ?? 0) >= minSim);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((r) => {
        const hay =
          [
            r.name,
            r.country,
            r.contact_email,
            r.website,
            ...(r.specialties ?? []),
            r.rationale,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return hay.includes(needle);
      });
    }
    if (activeSpecs.length) {
      list = list.filter((r) =>
        activeSpecs.every((s) => (r.specialties ?? []).includes(s))
      );
    }
    switch (sort) {
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "country":
        list = [...list].sort(
          (a, b) => (a.country ?? "").localeCompare(b.country ?? "")
        );
        break;
      default:
        list = [...list].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    }
    return list;
  }, [deduped, q, minSim, sort, activeSpecs]);

  // UI helpers
  const toggleSpec = (s: string) =>
    setActiveSpecs((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  // States
  if (!projectId) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <EmptyCard title="Missing projectId" body="Open this page via Create & Match or include ?projectId=…" />
        </div>
      </main>
    );
  }
  if (err) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <ErrorCard message={err} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
      {/* Top banner */}
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">Matching results</div>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Top CRO Matches</h1>
              <p className="mt-1 text-sm text-white/90">
                Ranked by capability fit. Refine with filters to shortlist partners.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/projects/new`}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
              >
                New project
              </Link>
              <Link
                href={`/sponsor/me`}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Sponsor dashboard
              </Link>
            </div>
          </div>
        </div>
        {/* subtle molecules */}
        <svg className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 opacity-20" viewBox="0 0 200 200">
          <g fill="none" stroke="white" strokeWidth="2">
            <circle cx="100" cy="20" r="8" /><circle cx="160" cy="60" r="6" /><circle cx="40" cy="60" r="6" /><circle cx="100" cy="100" r="10" />
            <path d="M100 20C100 60 40 60 40 60M100 20C100 60 160 60 160 60M40 60C60 100 60 140 60 140M160 60C140 100 140 140 140 140M60 140C100 170 140 140 140 140" />
          </g>
        </svg>
      </div>

      {/* Body */}
<div className="mx-auto max-w-6xl px-6 py-8">
  {/* Use 12-col layout so the sidebar can be wider (4/12) */}
  <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
    {/* Filters — now wider and compact */}
    <aside className="order-2 md:order-1 md:col-span-4">
      <div
        className="
          sticky top-4 rounded-2xl border border-slate-200 bg-white/80
          p-4 shadow-sm backdrop-blur
          max-h-[calc(100vh-6rem)] overflow-auto
        "
      >
        <h2 className="text-lg font-semibold tracking-wide text-slate-900">Refine</h2>

        {/* Search */}
        <label className="mt-3 block">
          <div className="mb-1 text-xs font-medium text-slate-700">Search</div>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
            placeholder="Name, specialty, country…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        {/* Minimum match (compact) */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Minimum match</span>
            <span className="text-[11px] font-medium text-slate-600">{Math.round(minSim * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(minSim * 100)}
            onChange={(e) => setMinSim(Number(e.target.value) / 100)}
            className="w-full"
          />
        </div>

        {/* Sort by */}
        <label className="mt-4 block">
          <div className="mb-1 text-xs font-medium text-slate-700">Sort by</div>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="best">Best match</option>
            <option value="name">Name (A–Z)</option>
            <option value="country">Country (A–Z)</option>
          </select>
        </label>

        {/* Specialties (capped height, scroll) */}
        {allSpecs.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-800">Specialties</div>
              {activeSpecs.length > 0 && (
                <button
                  className="text-[11px] text-slate-600 underline"
                  onClick={() => setActiveSpecs([])}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-40 overflow-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {allSpecs.map((s) => {
                  const active = activeSpecs.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setActiveSpecs((prev) =>
                          prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                        )
                      }
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ring-1 ring-inset transition ${
                        active
                          ? "bg-indigo-600 text-white ring-indigo-500"
                          : "bg-indigo-50 text-indigo-700 ring-indigo-200 hover:bg-indigo-100"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>

    {/* Results — spans 8/12 now to balance the wider sidebar */}
    <section className="order-1 md:order-2 md:col-span-8">
      {loading || !data ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <EmptyCard
          title="No matches after filtering"
          body="Try lowering the minimum match, clearing specialties, or adjusting your search terms."
          cta={{ href: `/projects/new`, label: "Create another project" }}
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((r, i) => {
            const key = r.cro_id || `${r.name}|${r.contact_email || "no-email"}|${i}`;
            const score = Math.round((r.similarity ?? 0) * 100);
            const isOpen = !!expanded[key];

            return (
              <li
                key={key}
                className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      className="text-lg font-semibold text-slate-900 hover:underline"
                      href={`/cros/${encodeURIComponent(r.cro_id)}?projectId=${encodeURIComponent(
                        data!.project_id
                      )}`}
                    >
                      {r.name}
                    </Link>
                    <div className="mt-1 text-sm text-slate-600">
                      {r.country ? `${r.country}` : "—"}
                      {r.website ? (
                        <>
                          {" • "}
                          <a
                            className="text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                            href={r.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.website.replace(/^https?:\/\//, "")}
                          </a>
                        </>
                      ) : null}
                    </div>

                    {Array.isArray(r.specialties) && r.specialties.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.specialties.slice(0, 6).map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            {s}
                          </span>
                        ))}
                        {r.specialties.length > 6 && (
                          <span className="text-[11px] text-slate-600">
                            +{r.specialties.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Match score */}
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Match score</span>
                      <span className="font-medium text-slate-800">{score}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Rationale */}
                {r.rationale && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpanded((m) => ({ ...m, [key]: !m[key] }))}
                      className="text-xs font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                    >
                      {isOpen ? "Hide" : "Why this match?"}
                    </button>
                    {isOpen && (
                      <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        {r.rationale}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                    href={`/cros/${encodeURIComponent(r.cro_id)}?projectId=${encodeURIComponent(
                      data!.project_id
                    )}`}
                  >
                    View profile
                  </Link>
                  {r.cro_user_id && (
                    <Link
                      className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      href={`/chat/${encodeURIComponent(data!.project_id)}/${encodeURIComponent(
                        r.cro_user_id
                      )}`}
                    >
                      Start chat
                    </Link>
                  )}
                  
                  {r.website && (
                    <a
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      href={r.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Website
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  </div>
</div>

    </main>
  );
}

/* ---------------- UI helpers ---------------- */

function SkeletonList() {
  return (
    <ul className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur"
        >
          <div className="h-4 w-2/5 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-full rounded bg-slate-200" />
          <div className="mt-3 flex gap-2">
            <div className="h-8 w-28 rounded bg-slate-200" />
            <div className="h-8 w-24 rounded bg-slate-200" />
            <div className="h-8 w-24 rounded bg-slate-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-700 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
      <h2 className="text-lg font-semibold">Couldn’t load matches</h2>
      <p className="mt-1 text-sm">{message}</p>
      <div className="mt-3 text-xs text-rose-800/80">
        If this persists, try re-running matching from your project or contact support.
      </div>
    </div>
  );
}
