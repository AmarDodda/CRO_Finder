// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function NewCRO() {
//   const router = useRouter();
//   const [form, setForm] = useState({ name: "", website: "", country: "", specialties: "", contact_email: "" });
//   const [status, setStatus] = useState<string | null>(null);
//   const [busy, setBusy] = useState(false);

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setBusy(true);
//     setStatus(null);
//     try {
//       const specialties = form.specialties.split(",").map(s => s.trim()).filter(Boolean);
//       const r = await fetch("/api/cros", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...form, specialties }),
//       });
//       const j = await r.json();
//       if (!r.ok) throw new Error(j.error || "Failed to save CRO");
//       // ✅ redirect to CRO dashboard
//       router.replace(`/cros/${j.id}/dashboard`);
//     } catch (e: any) {
//       setStatus(e.message ?? "Error");
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-4">
//       <h1 className="text-2xl font-semibold">CRO Onboarding</h1>
//       <form onSubmit={onSubmit} className="space-y-3">
//         {[
//           ["name","Name*"],
//           ["website","Website"],
//           ["country","Country"],
//           ["specialties","Specialties (comma separated)"],
//           ["contact_email","Contact email"],
//         ].map(([k,label]) => (
//           <div key={k} className="flex flex-col gap-1">
//             <label className="text-sm font-medium">{label}</label>
//             <input
//               className="border rounded px-3 py-2"
//               value={(form as any)[k]}
//               onChange={e => setForm({ ...form, [k]: e.target.value })}
//               required={k==="name" || k==="contact_email"}
//             />
//           </div>
//         ))}
//         <button disabled={busy} className="bg-black text-white px-4 py-2 rounded">
//           {busy ? "Saving…" : "Save"}
//         </button>
//       </form>
//       {status && <p className="text-sm text-red-600">{status}</p>}
//     </div>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/** Minimal country list (add more as needed) */
const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Spain",
  "Italy", "Netherlands", "Sweden", "Switzerland", "India", "Japan",
  "South Korea", "Australia", "Brazil", "Singapore", "Israel", "China",
];

export default function NewCRO() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    website: "",
    country: "",
    specialtiesInput: "",      // free text entry for chip input
    specialties: [] as string[],// canonical list
    contact_email: "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const emailValid = useMemo(() => {
    if (!form.contact_email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email);
  }, [form.contact_email]);

  function normalizeWebsite(u: string) {
    const v = u.trim();
    if (!v) return "";
    if (!/^https?:\/\//i.test(v)) return `https://${v}`;
    return v;
  }

  function commitSpecialtiesFromInput() {
    if (!form.specialtiesInput.trim()) return;
    const parts = form.specialtiesInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setForm((f) => ({
      ...f,
      specialties: Array.from(new Set([...f.specialties, ...parts])).slice(0, 24),
      specialtiesInput: "",
    }));
  }

  function removeSpecialty(s: string) {
    setForm((f) => ({ ...f, specialties: f.specialties.filter((x) => x !== s) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.name.trim()) return setErr("Please provide your CRO name.");
    if (!form.contact_email.trim() || !emailValid) return setErr("Please provide a valid contact email.");

    // fold any pending input into chips
    if (form.specialtiesInput.trim()) commitSpecialtiesFromInput();

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        website: normalizeWebsite(form.website),
        country: form.country,
        specialties: form.specialties,
        contact_email: form.contact_email.trim(),
      };

      const r = await fetch("/api/cros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Failed to save CRO");

      // ✅ redirect to CRO dashboard (keep your existing target; change to /cros/me if you prefer)
      router.replace(`/cros/${j.id}/dashboard`);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
      {/* Header — CRO accent (teal → sky → violet) */}
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">CRO Onboarding</div>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Create your CRO profile</h1>
              <p className="mt-1 text-sm text-white/90">Showcase capabilities and start receiving qualified sponsor inquiries.</p>
            </div>
            <a
              href="/cros/me"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              Skip for now
            </a>
          </div>
        </div>
        {/* decorative molecules */}
        <svg className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 opacity-20" viewBox="0 0 200 200">
          <g fill="none" stroke="white" strokeWidth="2">
            <circle cx="100" cy="20" r="8" /><circle cx="160" cy="60" r="6" /><circle cx="40" cy="60" r="6" /><circle cx="100" cy="100" r="10" />
            <path d="M100 20C100 60 40 60 40 60M100 20C100 60 160 60 160 60M40 60C60 100 60 140 60 140M160 60C140 100 140 140 140 140M60 140C100 170 140 140 140 140" />
          </g>
        </svg>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Form card */}
          <section className="md:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-900">Company details</h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Name*" hint="Your CRO’s legal or brand name.">
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Apex Trials Inc."
                      required
                      aria-required="true"
                    />
                  </Field>

                  <Field label="Website" hint="We’ll normalize https:// for you.">
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                      value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      placeholder="apextrials.com"
                    />
                  </Field>

                  <Field label="Country" hint="Primary operating country.">
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    >
                      <option value="">— Select —</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Contact email*"
                    hint="Shown on your messages; for sponsor communications."
                  >
                    <input
                      type="email"
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2 ${
                        !emailValid ? "border-rose-300" : "border-slate-300"
                      }`}
                      value={form.contact_email}
                      onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                      placeholder="contact@apextrials.com"
                      required
                      aria-invalid={!emailValid}
                    />
                    {!emailValid && (
                      <p className="mt-1 text-xs text-rose-600">Please enter a valid email address.</p>
                    )}
                  </Field>
                </div>
              </div>

              {/* Specialties chips */}
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-900">Specialties</h2>
                <p className="mt-1 text-xs text-slate-600">
                  Add therapeutic areas or capabilities (e.g., Oncology, PK/PD, DCT, Rare Disease).
                </p>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap gap-2">
                    {form.specialties.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"
                      >
                        {s}
                        <button
                          type="button"
                          className="ml-1 rounded-full px-1 text-indigo-700/80 hover:bg-indigo-100"
                          onClick={() => removeSpecialty(s)}
                          aria-label={`Remove ${s}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                    value={form.specialtiesInput}
                    onChange={(e) => setForm((f) => ({ ...f, specialtiesInput: e.target.value }))}
                    onBlur={commitSpecialtiesFromInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitSpecialtiesFromInput();
                      }
                    }}
                    placeholder="Type and press Enter or comma…"
                  />
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
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-60"
                >
                  {busy && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                    </svg>
                  )}
                  {busy ? "Saving…" : "Save"}
                </button>

                <a
                  href="/cros/me"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </a>

                <div className="text-xs text-slate-500">SOC 2-ready • HIPAA/GDPR aware</div>
              </div>
            </form>
          </section>

          {/* Tips */}
          <aside className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">Tips for stronger profiles</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><Dot color="bg-teal-500" /> Use your <b>official domain</b> and <b>inbox</b> for trust.</li>
              <li><Dot color="bg-sky-500" /> List <b>therapeutic strengths</b> and <b>capabilities</b> as specialties.</li>
              <li><Dot color="bg-violet-500" /> Keep <b>country</b> accurate for regional matching.</li>
            </ul>
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
              You can edit these details at any time from your CRO dashboard.
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
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      {children}
    </label>
  );
}

function Dot({ color = "bg-slate-400" }: { color?: string }) {
  return <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}
