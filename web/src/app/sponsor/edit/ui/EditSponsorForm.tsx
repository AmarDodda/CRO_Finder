// app/sponsor/edit/ui/EditSponsorForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SponsorProfile = { id: string; full_name: string; email: string };

export default function EditSponsorForm({ profile }: { profile: SponsorProfile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMsg("Saved ✔");
      router.replace("/sponsor/me");
      router.refresh();
    } catch (err: any) {
      setMsg(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Profile details</h2>
        <div className="text-xs text-slate-600">This does not change your login email</div>
      </div>

      <label className="block">
        <div className="mb-1 text-sm font-medium text-slate-800">Full name</div>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          required
        />
      </label>

      <label className="block">
        <div className="mb-1 text-sm font-medium text-slate-800">Email (read-only)</div>
        <input
          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
          value={profile.email}
          readOnly
          disabled
        />
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {busy && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          )}
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
