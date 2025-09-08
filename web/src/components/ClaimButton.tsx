"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimButton({ croId }: { croId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/cros/${croId}/claim`, { method: "POST" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || r.statusText);
      }
      router.refresh(); // re-fetches the server page so owner appears
    }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setErr(msg);
  } 
    finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <button disabled={busy} className="border px-3 py-1 rounded">
        {busy ? "Claiming…" : "Claim this CRO"}
      </button>
      {err && <div className="text-sm text-red-600 mt-1">{err}</div>}
    </form>
  );
}
