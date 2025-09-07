"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton({
  redirectTo = "/auth?role=cro&mode=login",
  className = "",
}: {
  redirectTo?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    try {
      setBusy(true);
      // Ask the server to clear Supabase cookies
      await fetch("/auth/signout", { method: "POST" });
      // Hard navigate to avoid any stale RSC cache
      router.replace(redirectTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className={
        className ||
        "rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20 disabled:opacity-60"
      }
      aria-busy={busy}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
