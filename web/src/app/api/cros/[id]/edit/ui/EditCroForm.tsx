// app/cros/[id]/edit/ui/EditCroForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CroRow = {
  id: string;
  name: string | null;
  website: string | null;
  country: string | null;
  contact_email: string | null;
  specialties: string[] | null;
};

export default function EditCroForm({ cro }: { cro: CroRow }) {
  const router = useRouter();
  const [name, setName] = useState(cro.name ?? "");
  const [website, setWebsite] = useState(cro.website ?? "");
  const [country, setCountry] = useState(cro.country ?? "");
  const [contactEmail, setContactEmail] = useState(cro.contact_email ?? "");
  const [specialties, setSpecialties] = useState((cro.specialties ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/cros/${cro.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          website: website || null,
          country: country || null,
          contact_email: contactEmail || null,
          specialties: specialties
            ? specialties
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Update failed");
      }

      setMsg("Saved ✔");
      router.refresh(); // revalidate server data
      // Optional: router.push(`/cros/me`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setMsg(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Profile details</h2>
        <div className="text-xs text-slate-600">All changes are saved to your public page</div>
      </div>

      <Field label="Name">
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Apex Trials Inc."
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Website">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            inputMode="url"
          />
        </Field>
        <Field label="Country">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="United States"
          />
        </Field>
      </div>

      <Field label="Contact email">
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="contact@example.com"
          inputMode="email"
        />
      </Field>

      <Field label="Specialties (comma separated)">
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          placeholder="Oncology, Endocrinology, Rare Disease"
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {busy ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          ) : null}
          Save changes
        </button>
        <button
          type="button"
          onClick={() => history.back()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Cancel
        </button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      {children}
    </label>
  );
}
