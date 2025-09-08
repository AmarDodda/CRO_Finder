// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function NewProject() {
//   const [form, setForm] = useState({ title: "", description: "", therapy_area: "", phase: "", budget: "" });
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     const payload = { ...form, budget: form.budget ? Number(form.budget) : null, k: 10, min_similarity: 0.5 };
//     const r = await fetch("/api/match-project", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
//     const j = await r.json();
//     setLoading(false);
//     if (!r.ok) return alert(j.error ?? "Error");
//     router.push(`/matches?projectId=${j.project_id}`);
//   }

//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-4">
//       <h1 className="text-2xl font-semibold">New Project</h1>
//       <form onSubmit={onSubmit} className="space-y-3">
//         {[
//           ["title","Title*"], ["description","Description"], ["therapy_area","Therapy Area"], ["phase","Phase"], ["budget","Budget (USD)"]
//         ].map(([k,label]) => (
//           <div key={k} className="flex flex-col gap-1">
//             <label className="text-sm font-medium">{label}</label>
//             <input
//               className="border rounded px-3 py-2"
//               value={(form as any)[k]}
//               onChange={e => setForm({ ...form, [k]: e.target.value })}
//               required={k==="title"}
//             />
//           </div>
//         ))}
//         <button disabled={loading} className="bg-black text-white px-4 py-2 rounded">
//           {loading ? "Matching…" : "Create & Match"}
//         </button>
//       </form>
//     </div>
//   );
// }


"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/** Curated options for faster entry (adjust as needed) */
const THERAPY_AREAS = [
  "Oncology",
  "Metabolic / Endocrinology",
  "Neurology",
  "Cardiology",
  "Immunology",
  "Infectious Disease",
  "Rare Disease",
  "Dermatology",
  "Respiratory",
  "Gastroenterology",
  "None of the above"
];

const PHASES = ["Preclinical", "Phase I", "Phase II", "Phase III", "Phase IV", "Observational / PMS"];

export default function NewProject() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    therapy_area: "",
    phase: "",
    budget: "" as string | number,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const descCount = form.description.length;
  const descMax = 800;

  const budgetNum = useMemo(() => {
    const n = Number(form.budget);
    return Number.isFinite(n) ? n : 0;
  }, [form.budget]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.title.trim()) {
      setErr("Please provide a project title.");
      return;
    }
    if (form.description && form.description.length > descMax) {
      setErr(`Description is too long (max ${descMax} characters).`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget ? Number(form.budget) : null,
        k: 10,
        min_similarity: 0.5,
      };

      const r = await fetch("/api/match-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(j.error || "Failed to create project");
      }

      router.push(`/matches?projectId=${j.project_id}`);
      } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Something went wrong";
    setErr(msg);
  }

    finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 via-white to-white text-slate-800">
      {/* Top banner */}
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">Project intake</div>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Create a new project</h1>
              <p className="mt-1 text-sm text-white/90">
                Describe your study and we’ll match you to FDA-ready CRO partners.
              </p>
            </div>
            <a
              href="/sponsor/me"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              Back to dashboard
            </a>
          </div>
        </div>
        {/* decorative molecules */}
        <svg className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 opacity-20" viewBox="0 0 200 200">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Form */}
          <section className="md:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              {/* Section: Basics */}
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-900">Basics</h2>
                <div className="mt-3 space-y-4">
                  <Field label="Title*" hint="A concise, specific working title.">
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g., Phase IIb Oncology Trial – HER2+ Solid Tumors"
                      required
                      aria-required="true"
                    />
                  </Field>

                  <Field
                    label="Description"
                    hint="Key endpoints, patient population, sites/regions, timelines, and any special requirements."
                    counter={`${descCount}/${descMax}`}
                    counterWarn={descCount > descMax}
                  >
                    <textarea
                      className="h-36 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the study context so we can match the right CRO capabilities…"
                      maxLength={1200} // hard cap to prevent extremes
                    />
                  </Field>
                </div>
              </div>

              {/* Section: Study details */}
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-900">Study details</h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Therapy area" hint="Choose the closest fit.">
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
                      value={form.therapy_area}
                      onChange={(e) => setForm((f) => ({ ...f, therapy_area: e.target.value }))}
                    >
                      <option value="">— Select —</option>
                      {THERAPY_AREAS.map((ta) => (
                        <option key={ta} value={ta}>
                          {ta}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Phase" hint="Clinical / non-clinical stage.">
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
                      value={form.phase}
                      onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
                    >
                      <option value="">— Select —</option>
                      {PHASES.map((ph) => (
                        <option key={ph} value={ph}>
                          {ph}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Section: Budget & priorities */}
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-900">Budget & priorities</h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Estimated budget (USD)" hint="An estimate is fine. Improves match quality.">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={5_000_000}
                        step={50_000}
                        className="flex-1"
                        value={budgetNum}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setForm((f) => ({ ...f, budget: val }));
                        }}
                      />
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-36 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
                        value={form.budget}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, "");
                          setForm((f) => ({ ...f, budget: raw }));
                        }}
                        placeholder="e.g., 750000"
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {budgetNum > 0 ? Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(budgetNum) : "Not specified"}
                    </div>
                  </Field>
                </div>
              </div>

              {/* Error + Actions */}
              {err && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {err}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60"
                >
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                    </svg>
                  )}
                  {loading ? "Matching…" : "Create & Match"}
                </button>

                <a
                  href="/sponsor/me"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </a>

                <div className="text-xs text-slate-500">
                  HIPAA/GDPR aware • Private by design • Only matched CROs see your details
                </div>
              </div>
            </form>
          </section>

          {/* Tips / Guidance */}
          <aside className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">Tips for better matches</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <Dot color="bg-indigo-500" /> Include <b>primary endpoints</b> and <b>patient population</b>.
              </li>
              <li>
                <Dot color="bg-sky-500" /> Mention <b>regions/sites</b> or country preferences.
              </li>
              <li>
                <Dot color="bg-cyan-500" /> Share <b>timeline constraints</b> or start dates.
              </li>
              <li>
                <Dot color="bg-emerald-500" /> Note any <b>special capabilities</b> (e.g., DCT, PK/PD, central lab).
              </li>
            </ul>
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
              You can refine requirements later and re-run matching without losing messages or history.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ---------- Small UI helpers ---------- */
function Field({
  label,
  hint,
  counter,
  counterWarn,
  children,
}: {
  label: string;
  hint?: string;
  counter?: string;
  counterWarn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {(hint || counter) && (
          <div className="flex items-center gap-3">
            {hint && <div className="text-xs text-slate-500">{hint}</div>}
            {counter && (
              <div className={`text-[11px] ${counterWarn ? "text-rose-600" : "text-slate-500"}`}>
                {counter}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </label>
  );
}

function Dot({ color = "bg-slate-400" }: { color?: string }) {
  return <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}
