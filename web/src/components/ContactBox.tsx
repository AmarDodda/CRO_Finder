// "use client";
// import { useState } from "react";

// export default function ContactBox({
//   croId,
//   projectId,
//   contactEmail,
// }: {
//   croId: string;
//   projectId?: string;
//   contactEmail?: string | null;
// }) {
//   const [status, setStatus] = useState<string | null>(null);

//   async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     const fd = new FormData(e.currentTarget);
//     const sponsor_email = String(fd.get("sponsor_email") ?? "").trim();
//     const message = String(fd.get("message") ?? "").trim();

//     setStatus("Sending…");
//     try {
//       const r = await fetch("/api/contact", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           cro_id: croId,
//           project_id: projectId ?? null,
//           sponsor_email,
//           message,
//         }),
//       });
//       const j = await r.json().catch(() => ({}));
//       if (!r.ok) throw new Error(j.error || "Failed to send");
//       setStatus("Sent! The CRO has been notified.");
//       e.currentTarget.reset();
//     } catch (err: any) {
//       setStatus(`Error: ${err.message}`);
//     }
//   }

//   return (
//     <form onSubmit={onSubmit} className="mt-4 border rounded p-4 space-y-2">
//       <div className="font-medium">Contact this CRO</div>
//       {contactEmail && (
//         <div className="text-sm">
//           Email: <a className="underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
//         </div>
//       )}
//       <input name="sponsor_email" type="email" placeholder="Your email" className="border rounded px-3 py-2 w-full" />
//       <textarea name="message" placeholder="Short message (optional)" className="border rounded px-3 py-2 w-full" />
//       <button className="bg-black text-white px-4 py-2 rounded">Send Inquiry</button>
//       {status && <div className="text-sm mt-1">{status}</div>}
//     </form>
//   );
// }


"use client";
import { useMemo, useRef, useState } from "react";

export default function ContactBox({
  croId,
  projectId,
  contactEmail,
}: {
  croId: string;
  projectId?: string;
  contactEmail?: string | null;
}) {
  const [status, setStatus] = useState<null | { type: "idle" | "sending" | "ok" | "err"; msg?: string }>({ type: "idle" });
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const emailValid = useMemo(() => {
    if (!email.trim()) return true; // soft-validate until submit
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const remaining = 600 - msg.length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !emailValid) {
      setStatus({ type: "err", msg: "Please provide a valid email." });
      return;
    }
    setStatus({ type: "sending" });
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cro_id: croId,
          project_id: projectId ?? null,
          sponsor_email: email.trim(),
          message: msg.trim(),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Failed to send");
      setStatus({ type: "ok", msg: "Sent! The CRO has been notified." });
      setMsg("");
      formRef.current?.reset();
    } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Something went wrong";
    setStatus({ type: "err", msg });
}
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="
        mt-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur
      "
      aria-describedby="contact-help"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Contact this CRO</h3>
        {contactEmail && (
          <CopyEmail email={contactEmail} />
        )}
      </div>

      {contactEmail && (
        <div className="mt-1 text-sm text-slate-600">
          Direct email:{" "}
          <a
            className="text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
        </div>
      )}

      <div id="contact-help" className="mt-2 text-xs text-slate-500">
        Your email will be shared with the CRO to continue the conversation. Keep it concise and specific.
      </div>

      {/* Email */}
      <label className="mt-4 block">
        <div className="mb-1 text-sm font-medium text-slate-800">Your email*</div>
        <input
          name="sponsor_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={!emailValid}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2 ${
            !emailValid ? "border-rose-300" : "border-slate-300"
          }`}
          placeholder="you@company.com"
        />
        {!emailValid && (
          <p className="mt-1 text-xs text-rose-600">Please enter a valid email address.</p>
        )}
      </label>

      {/* Message */}
      <label className="mt-3 block">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-800">Short message (optional)</div>
          <div className={`text-xs ${remaining < 0 ? "text-rose-600" : "text-slate-500"}`}>{remaining} / 600</div>
        </div>
        <textarea
          name="message"
          rows={4}
          maxLength={650} // soft cap; we enforce 600 via counter feedback
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
          placeholder="e.g., We have a Phase II oncology trial (US/EU) starting Q1—are you taking new studies?"
        />
      </label>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status.type === "sending"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
        >
          {status.type === "sending" && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          )}
          {status.type === "sending" ? "Sending…" : "Send inquiry"}
        </button>

        <span
          role="status"
          aria-live="polite"
          className={
            status.type === "ok"
              ? "text-xs font-medium text-emerald-700"
              : status.type === "err"
              ? "text-xs font-medium text-rose-700"
              : "text-xs text-slate-500"
          }
        >
          {status.type === "ok" && (status.msg || "Sent! The CRO has been notified.")}
          {status.type === "err" && (status.msg || "Something went wrong.")}
        </span>
      </div>

      {/* Compliance note */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        We’re GDPR/HIPAA-aware and only share what’s needed for the introduction.
      </div>
    </form>
  );
}

/* ---------- Small UI helper: copy-to-clipboard email ---------- */
function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-white/40 bg-white/10 px-2.5 py-1 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
      title="Copy email"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <rect x="4" y="4" width="11" height="11" rx="2" />
      </svg>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
