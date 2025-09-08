// "use client";
// import { useMemo, useState } from "react";
// import type { FormEvent } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { supabaseBrowser } from "@/lib/supabaseBrowser";

// export default function AuthPage() {
//   const router = useRouter();
//   const sp = useSearchParams();
//   const urlRole = sp.get("role") === "cro" ? "cro" : "sponsor";
//   const supabase = useMemo(supabaseBrowser, []);

//   const [mode, setMode] = useState<"login" | "signup">(
//     (sp.get("mode") as "login" | "signup") ?? "login"
//   );
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [showPw, setShowPw] = useState(false);
//   const [msg, setMsg] = useState<string | null>(null);
//   const [busy, setBusy] = useState(false);

//   async function onSubmit(e: FormEvent) {
//     e.preventDefault();
//     setMsg(null);
//     setBusy(true);
//     try {
//       if (mode === "signup") {
//         const { error } = await supabase.auth.signUp({
//           email,
//           password,
//           options: {
//             data: { full_name: fullName, role: urlRole },
//             emailRedirectTo: `${window.location.origin}/auth?role=${urlRole}`,
//           },
//         });
//         if (error) throw error;
//         await supabase.auth.signOut(); // don’t auto-login on signup
//         setMsg("Check your email to confirm your account, then sign in.");
//         setMode("login");
//         return;
//       }

//       const { error } = await supabase.auth.signInWithPassword({ email, password });
//       if (error) throw error;

//       // Ensure profile exists / role saved
//       await fetch("/api/profile/bootstrap", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ role: urlRole }),
//       }).catch(() => {});

//       await smartRedirectAfterAuth(urlRole, supabase, router);
//     } catch (e: any) {
//       setMsg(e?.message ?? "Authentication failed");
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800 selection:bg-sky-200 selection:text-slate-900">
//       {/* Decorative blobs */}
//       <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
//         <div className="absolute top-[-12%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-sky-200/30 blur-3xl" />
//         <div className="absolute bottom-[-16%] left-[-12%] h-[32rem] w-[32rem] rounded-full bg-cyan-200/30 blur-3xl" />
//       </div>

//       {/* Page container */}
//       <div className="mx-auto flex min-h-[100dvh] max-w-7xl items-center justify-center px-6 py-10">
//         <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-12">
//           {/* Left: brand + copy */}
//           <aside className="md:col-span-6">
//             <div className="mb-6 flex items-center gap-2">
//               <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-sm">
//                 {/* simple flask icon */}
//                 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
//                   <path d="M9 2h6M10 2v5l-6.4 9.6A3 3 0 0 0 6 22h12a3 3 0 0 0 2.4-4.8L14 7V2" />
//                   <circle cx="9.5" cy="14.5" r=".8" />
//                   <circle cx="12" cy="12" r=".8" />
//                   <circle cx="14.5" cy="16" r=".8" />
//                 </svg>
//               </div>
//               <span className="text-lg font-semibold tracking-tight text-slate-900">CRO Finder</span>
//             </div>
//             <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900">
//               {mode === "login" ? "Welcome back." : "Create your account."}
//             </h1>
//             <p className="mt-3 max-w-prose text-slate-600">
//               {urlRole === "cro"
//                 ? "Access your CRO workspace to showcase capabilities and respond to qualified study leads."
//                 : "Access your sponsor workspace to discover the best-fit CRO partners and start secure conversations."}
//             </p>

//             {/* Theme-aligned highlights */}
//             <ul className="mt-6 space-y-2 text-sm text-slate-700">
//               <li className="flex items-start gap-2">
//                 <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500" />
//                 Private by design (HIPAA/GDPR aware) with verifiable message trails
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
//                 Evidence-based scoring across therapeutic area, phase, and geography
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
//                 Enterprise-grade UX with clean, accessible design
//               </li>
//             </ul>
//           </aside>

//           {/* Right: auth card */}
//           <section className="md:col-span-6">
//             <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
//               {/* Role chip + tabs */}
//               <div className="flex items-center justify-between">
//                 <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
//                   <span className={`h-1.5 w-1.5 rounded-full ${urlRole === "cro" ? "bg-violet-500" : "bg-sky-500"}`} />
//                   {urlRole === "cro" ? "CRO Portal" : "Sponsor Portal"}
//                 </div>
//                 <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
//                   <button
//                     type="button"
//                     onClick={() => setMode("login")}
//                     className={`px-3 py-1.5 rounded-lg transition-colors ${
//                       mode === "login" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
//                     }`}
//                     aria-pressed={mode === "login"}
//                   >
//                     Sign in
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setMode("signup")}
//                     className={`px-3 py-1.5 rounded-lg transition-colors ${
//                       mode === "signup" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
//                     }`}
//                     aria-pressed={mode === "signup"}
//                   >
//                     Create account
//                   </button>
//                 </div>
//               </div>

//               {/* Subtitle */}
//               <p className="mt-2 text-sm text-slate-600">
//                 {urlRole === "cro"
//                   ? mode === "login"
//                     ? "Sign in to manage your CRO profile and inquiries."
//                     : "Create your CRO account and start receiving qualified requests."
//                   : mode === "login"
//                   ? "Sign in to review matches and manage studies."
//                   : "Create your sponsor account and get curated CRO matches."}
//               </p>

//               {/* Form */}
//               <form onSubmit={onSubmit} className="mt-5 space-y-4">
//                 {mode === "signup" && (
//                   <div className="flex flex-col gap-1.5">
//                     <label htmlFor="full_name" className="text-sm font-medium text-slate-800">
//                       Full name
//                     </label>
//                     <input
//                       id="full_name"
//                       className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
//                       value={fullName}
//                       onChange={(e) => setFullName(e.target.value)}
//                       placeholder="Jane Doe"
//                       autoComplete="name"
//                       required
//                     />
//                   </div>
//                 )}

//                 <div className="flex flex-col gap-1.5">
//                   <label htmlFor="email" className="text-sm font-medium text-slate-800">
//                     Email
//                   </label>
//                   <input
//                     id="email"
//                     className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="you@example.com"
//                     autoComplete="email"
//                     required
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label htmlFor="password" className="flex items-center justify-between text-sm font-medium text-slate-800">
//                     <span>Password</span>
//                     {mode === "login" && (
//                       <Link href="/auth/reset" className="text-xs font-normal text-slate-600 hover:text-slate-900">
//                         Forgot password?
//                       </Link>
//                     )}
//                   </label>
//                   <div className="relative">
//                     <input
//                       id="password"
//                       className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
//                       type={showPw ? "text" : "password"}
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       placeholder="********"
//                       autoComplete={mode === "signup" ? "new-password" : "current-password"}
//                       required
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPw((v) => !v)}
//                       aria-label={showPw ? "Hide password" : "Show password"}
//                       className="absolute inset-y-0 right-2 grid place-items-center px-2 text-slate-500 hover:text-slate-700"
//                     >
//                       <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
//                         {showPw ? (
//                           <>
//                             <path d="M3 3l18 18" />
//                             <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 3-3c0-.4-.1-.9-.2-1.2" />
//                             <path d="M2 12s3.5-7 10-7c2 0 3.8.7 5.2 1.7M22 12s-3.5 7-10 7c-2 0-3.8-.7-5.2-1.7" />
//                           </>
//                         ) : (
//                           <>
//                             <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
//                             <circle cx="12" cy="12" r="3.2" />
//                           </>
//                         )}
//                       </svg>
//                     </button>
//                   </div>
//                 </div>

//                 <button
//                   className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
//                   disabled={busy}
//                 >
//                   {busy && (
//                     <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
//                     </svg>
//                   )}
//                   {mode === "login" ? "Sign in" : "Create account"}
//                 </button>
//               </form>

//               {/* Message surface */}
//               {msg && (
//                 <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
//                   {msg}
//                 </div>
//               )}

//               {/* Switch link */}
//               <div className="mt-4 text-sm text-slate-600">
//                 {mode === "login" ? (
//                   <>
//                     No account?{" "}
//                     <button
//                       className="font-medium text-slate-900 underline underline-offset-4 hover:opacity-90"
//                       onClick={() => setMode("signup")}
//                     >
//                       Create one
//                     </button>
//                   </>
//                 ) : (
//                   <>
//                     Already have an account?{" "}
//                     <button
//                       className="font-medium text-slate-900 underline underline-offset-4 hover:opacity-90"
//                       onClick={() => setMode("login")}
//                     >
//                       Sign in
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Small trust row to echo home page tone */}
//             <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-600">
//               <div className="rounded-xl border bg-white/70 p-2 text-center">SOC 2-ready</div>
//               <div className="rounded-xl border bg-white/70 p-2 text-center">HIPAA-aware</div>
//               <div className="rounded-xl border bg-white/70 p-2 text-center">GDPR-aligned</div>
//             </div>
//           </section>
//         </div>
//       </div>
//     </main>
//   );
// }

// /** Redirect intelligently after a real login */
// async function smartRedirectAfterAuth(
//   roleParam: "sponsor" | "cro",
//   supabase: ReturnType<typeof supabaseBrowser>,
//   router: ReturnType<typeof useRouter>
// ) {
//   const { data: { user } } = await supabase.auth.getUser();
//   const uid = user?.id;
//   if (!uid) return router.replace("/");

//   // CRO flow
//   const { data: croRows } = await supabase
//     .from("cros")
//     .select("id")
//     .eq("owner", uid)
//     .order("created_at", { ascending: false })
//     .limit(1);

//   const ownedCroId = croRows?.[0]?.id as string | undefined;

//   if (roleParam === "cro") {
//     if (ownedCroId) router.replace("/cros/me");
//     else router.replace("/cros/new");
//     return;
//   }

//   // Sponsor flow: dashboard only if they have projects or messages; else intake
//   const { count: projectCount } = await supabase
//     .from("projects")
//     .select("*", { head: true, count: "exact" })
//     .eq("owner", uid);

//   if ((projectCount ?? 0) > 0) {
//     router.replace("/sponsor/me");
//     return;
//   }

//   const { count: msgCount } = await supabase
//     .from("contacts")
//     .select("*", { head: true, count: "exact" })
//     .or(`sender.eq.${uid},recipient.eq.${uid}`);

//   if ((msgCount ?? 0) > 0) {
//     router.replace("/sponsor/me");
//   } else {
//     router.replace("/projects/new");
//   }
// }


"use client";

import { useMemo, useState, type FormEvent, type ChangeEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/** Outer wrapper adds Suspense to satisfy Next 15 requirement for useSearchParams */
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading…</div>}>
      <AuthInner />
    </Suspense>
  );
}

/** Actual page content (unchanged logic) */
function AuthInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const urlRole: "cro" | "sponsor" = sp.get("role") === "cro" ? "cro" : "sponsor";
  const supabase = useMemo(supabaseBrowser, []);

  const [mode, setMode] = useState<"login" | "signup">(
    (sp.get("mode") as "login" | "signup") ?? "login"
  );
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [showPw, setShowPw] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: urlRole },
            emailRedirectTo: `${window.location.origin}/auth?role=${urlRole}`,
          },
        });
        if (error) throw error;
        await supabase.auth.signOut();
        setMsg("Check your email to confirm your account, then sign in.");
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Ensure profile exists / role saved
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: urlRole }),
      }).catch(() => {});

      await smartRedirectAfterAuth(urlRole, supabase, router);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setMsg(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800 selection:bg-sky-200 selection:text-slate-900">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-12%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-[-16%] left-[-12%] h-[32rem] w-[32rem] rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      {/* Page container */}
      <div className="mx-auto flex min-h-[100dvh] max-w-7xl items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-12">
          {/* Left: brand + copy */}
          <aside className="md:col-span-6">
            <div className="mb-6 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-sm">
                {/* simple flask icon */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 2h6M10 2v5l-6.4 9.6A3 3 0 0 0 6 22h12a3 3 0 0 0 2.4-4.8L14 7V2" />
                  <circle cx="9.5" cy="14.5" r=".8" />
                  <circle cx="12" cy="12" r=".8" />
                  <circle cx="14.5" cy="16" r=".8" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">CRO Finder</span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900">
              {mode === "login" ? "Welcome back." : "Create your account."}
            </h1>
            <p className="mt-3 max-w-prose text-slate-600">
              {urlRole === "cro"
                ? "Access your CRO workspace to showcase capabilities and respond to qualified study leads."
                : "Access your sponsor workspace to discover the best-fit CRO partners and start secure conversations."}
            </p>

            {/* Theme-aligned highlights */}
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500" />
                Private by design (HIPAA/GDPR aware) with verifiable message trails
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Evidence-based scoring across therapeutic area, phase, and geography
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                Enterprise-grade UX with clean, accessible design
              </li>
            </ul>
          </aside>

          {/* Right: auth card */}
          <section className="md:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
              {/* Role chip + tabs */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                  <span className={`h-1.5 w-1.5 rounded-full ${urlRole === "cro" ? "bg-violet-500" : "bg-sky-500"}`} />
                  {urlRole === "cro" ? "CRO Portal" : "Sponsor Portal"}
                </div>
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      mode === "login" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                    aria-pressed={mode === "login"}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      mode === "signup" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                    aria-pressed={mode === "signup"}
                  >
                    Create account
                  </button>
                </div>
              </div>

              {/* Subtitle */}
              <p className="mt-2 text-sm text-slate-600">
                {urlRole === "cro"
                  ? mode === "login"
                    ? "Sign in to manage your CRO profile and inquiries."
                    : "Create your CRO account and start receiving qualified requests."
                  : mode === "login"
                  ? "Sign in to review matches and manage studies."
                  : "Create your sponsor account and get curated CRO matches."}
              </p>

              {/* Form */}
              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="full_name" className="text-sm font-medium text-slate-800">
                      Full name
                    </label>
                    <input
                      id="full_name"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                      value={fullName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-800">
                    Email
                  </label>
                  <input
                    id="email"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                    type="email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="flex items-center justify-between text-sm font-medium text-slate-800">
                    <span>Password</span>
                    {mode === "login" && (
                      <Link href="/auth/reset" className="text-xs font-normal text-slate-600 hover:text-slate-900">
                        Forgot password?
                      </Link>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="********"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-2 grid place-items-center px-2 text-slate-500 hover:text-slate-700"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        {showPw ? (
                          <>
                            <path d="M3 3l18 18" />
                            <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 3-3c0-.4-.1-.9-.2-1.2" />
                            <path d="M2 12s3.5-7 10-7c2 0 3.8.7 5.2 1.7M22 12s-3.5 7-10 7c-2 0-3.8-.7-5.2-1.7" />
                          </>
                        ) : (
                          <>
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                            <circle cx="12" cy="12" r="3.2" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  disabled={busy}
                >
                  {busy && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                    </svg>
                  )}
                  {mode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>

              {/* Message surface */}
              {msg && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {msg}
                </div>
              )}

              {/* Switch link */}
              <div className="mt-4 text-sm text-slate-600">
                {mode === "login" ? (
                  <>
                    No account?{" "}
                    <button
                      className="font-medium text-slate-900 underline underline-offset-4 hover:opacity-90"
                      onClick={() => setMode("signup")}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      className="font-medium text-slate-900 underline underline-offset-4 hover:opacity-90"
                      onClick={() => setMode("login")}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Small trust row */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="rounded-xl border bg-white/70 p-2 text-center">SOC 2-ready</div>
              <div className="rounded-xl border bg-white/70 p-2 text-center">HIPAA-aware</div>
              <div className="rounded-xl border bg-white/70 p-2 text-center">GDPR-aligned</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** Redirect intelligently after a real login */
async function smartRedirectAfterAuth(
  roleParam: "sponsor" | "cro",
  supabase: ReturnType<typeof supabaseBrowser>,
  router: ReturnType<typeof useRouter>
) {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id;
  if (!uid) return router.replace("/");

  // CRO flow
  const { data: croRows } = await supabase
    .from("cros")
    .select("id")
    .eq("owner", uid)
    .order("created_at", { ascending: false })
    .limit(1);

  const ownedCroId: string | undefined = croRows?.[0]?.id ?? undefined;

  if (roleParam === "cro") {
    if (ownedCroId) router.replace("/cros/me");
    else router.replace("/cros/new");
    return;
  }

  // Sponsor flow
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { head: true, count: "exact" })
    .eq("owner", uid);

  if ((projectCount ?? 0) > 0) {
    router.replace("/sponsor/me");
    return;
  }

  const { count: msgCount } = await supabase
    .from("contacts")
    .select("*", { head: true, count: "exact" })
    .or(`sender.eq.${uid},recipient.eq.${uid}`);

  if ((msgCount ?? 0) > 0) {
    router.replace("/sponsor/me");
  } else {
    router.replace("/projects/new");
  }
}

