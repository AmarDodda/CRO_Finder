// import Link from "next/link";

// export default function Home() {
//   return (
//     <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-gray-50">
//       <div className="grid gap-6 md:grid-cols-2 w-full max-w-4xl">
//         {/* Sponsor card */}
//         <div className="border rounded-2xl bg-white p-6 shadow-sm">
//           <h2 className="text-xl font-semibold">Sponsor / User</h2>
//           <p className="text-sm text-gray-600 mt-1">
//             Find the best CROs for your study and start chatting.
//           </p>
//           <div className="mt-4 flex flex-wrap gap-3">
//             <Link
//               className="bg-black text-white px-4 py-2 rounded"
//               href="/auth?role=sponsor&mode=signup&new=1"
//             >
//               Sign up
//             </Link>
//             <Link
//               className="border px-4 py-2 rounded"
//               href="/auth?role=sponsor&mode=login"
//             >
//               Log in
//             </Link>
//           </div>
//         </div>

//         {/* CRO card */}
//         <div className="border rounded-2xl bg-white p-6 shadow-sm">
//           <h2 className="text-xl font-semibold">CRO</h2>
//           <p className="text-sm text-gray-600 mt-1">
//             Onboard your CRO profile and receive project inquiries.
//           </p>
//           <div className="mt-4 flex flex-wrap gap-3">
//             <Link
//               className="bg-black text-white px-4 py-2 rounded"
//               href="/auth?role=cro&mode=signup&new=1"
//             >
//               Sign up
//             </Link>
//             <Link
//               className="border px-4 py-2 rounded"
//               href="/auth?role=cro&mode=login"
//             >
//               Log in
//             </Link>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }



"use client";
import Link from "next/link";

// Optional: inline SVG icons so you don't rely on any external libs
const Shield = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M12 3l7 3v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth={1.5} />
    <path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Flask = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M9 2h6M10 2v5l-6.4 9.6A3 3 0 0 0 6 22h12a3 3 0 0 0 2.4-4.8L14 7V2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    <circle cx="9.5" cy="14.5" r=".75" fill="currentColor" />
    <circle cx="12" cy="12" r=".75" fill="currentColor" />
    <circle cx="14.5" cy="16" r=".75" fill="currentColor" />
  </svg>
);

const Arrow = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800 selection:bg-sky-200 selection:text-slate-900">
      {/* Decorative background molecules */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[32rem] w-[32rem] rounded-full bg-cyan-200/30 blur-3xl" />
        <svg className="absolute inset-x-0 top-24 mx-auto w-[60rem] max-w-[95%] opacity-[0.08]" viewBox="0 0 1200 400" fill="none">
          <defs>
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <g stroke="url(#g1)">
            <circle cx="80" cy="120" r="28" />
            <circle cx="240" cy="200" r="18" />
            <circle cx="420" cy="100" r="22" />
            <circle cx="600" cy="220" r="26" />
            <circle cx="820" cy="160" r="20" />
            <circle cx="1040" cy="90" r="16" />
            <path d="M108 120L222 196M258 200L396 110M442 102l136 112M628 218l172-60M844 160l180-70" />
          </g>
        </svg>
      </div>

      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Flask className="h-6 w-6 text-sky-600" />
          <span className="text-lg font-semibold tracking-tight">CRO Finder</span>
        </div>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-sm text-slate-700 hover:text-slate-900">Features</Link>
          <Link href="#trust" className="text-sm text-slate-700 hover:text-slate-900">Trust</Link>
          <Link href="#contact" className="text-sm text-slate-700 hover:text-slate-900">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth?role=sponsor&mode=login" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Sign in
          </Link>
          <Link href="/auth?role=sponsor&mode=signup&new=1" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-10 pt-6 md:grid-cols-12 md:pb-16 md:pt-10">
        <div className="md:col-span-7">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Match with FDA‑ready CRO partners you can trust.
          </h1>
          <p className="mt-4 max-w-[52ch] text-base text-slate-600 md:text-lg">
            Purpose‑built for Life Sciences sponsors. Discover vetted CROs by therapeutic area, GxP capability,
            geography, and past study performance—then start secure conversations instantly.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/auth?role=sponsor&mode=signup&new=1" className="group inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2">
              For Sponsors
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/auth?role=cro&mode=signup&new=1" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
              For CROs
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            HIPAA / GDPR aware • Private by design • No spam—CROs only see qualified inquiries
          </p>
        </div>
        <div className="md:col-span-5">
          {/* Dual persona card */}
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-slate-500">Matching snapshot</div>
                <div className="mt-1 text-sm text-slate-600">Based on your current study profile</div>
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-medium text-white">12 matches</div>
            </div>

            {/* Filters row */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-sky-500"/> Endocrinology</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Phase II</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"/> North America</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-violet-500"/> Reg + Sites</span>
            </div>

            {/* Bars */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Therapeutic fit</span><span className="font-medium text-slate-900">92%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100" aria-label="Therapeutic fit 92%" role="progressbar" aria-valuenow={92} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-2 rounded-full bg-sky-500" style={{ width: "92%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>GxP readiness</span><span className="font-medium text-slate-900">88%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100" aria-label="GxP readiness 88%" role="progressbar" aria-valuenow={88} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: "88%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Geographic coverage</span><span className="font-medium text-slate-900">76%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100" aria-label="Geographic coverage 76%" role="progressbar" aria-valuenow={76} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: "76%" }} />
                </div>
              </div>
            </div>

            {/* Sparkline + CTA */}
            <div className="mt-5 flex items-center justify-between">
              <svg viewBox="0 0 120 36" className="h-10 w-32 text-sky-500" aria-hidden>
                <polyline fill="none" stroke="currentColor" strokeWidth="2" points="0,28 15,22 30,24 45,18 60,12 75,16 90,10 105,14 120,8"/>
              </svg>
              <Link href="/auth?role=sponsor&mode=signup&new=1" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50">View matches</Link>
            </div>
          </div>

          {/* Trust mini */}
          <div id="trust" className="mt-5 grid grid-cols-3 items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600" /> SOC 2‑ready</div>
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600" /> HIPAA‑aware</div>
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600" /> GDPR‑aligned</div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Flask className="h-5 w-5 text-sky-600" /> Therapeutic fit
            </h3>
            <p className="mt-2 text-sm text-slate-600">Filter CROs by oncology, metabolic, neuro, rare disease, and more—backed by previous study experience.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Shield className="h-5 w-5 text-sky-600" /> Quality & GxP signals
            </h3>
            <p className="mt-2 text-sm text-slate-600">Surface indicators like GLP/GCP readiness, certifications, and audit history where available.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Arrow className="h-5 w-5 text-sky-600" /> Instant outreach
            </h3>
            <p className="mt-2 text-sm text-slate-600">Message shortlisted CROs in a secure workspace; maintain a verifiable trail of conversations.</p>
          </div>
        </div>
      </section>

      {/* Logos / Social proof (placeholder) */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
          <p className="text-center text-xs uppercase tracking-wider">Trusted by teams across biotech & pharma</p>
          <div className="mt-4 grid grid-cols-2 gap-6 opacity-80 sm:grid-cols-3 md:grid-cols-6">
            <div className="h-10 rounded bg-slate-100" aria-hidden />
            <div className="h-10 rounded bg-slate-100" aria-hidden />
            <div className="h-10 rounded bg-slate-100" aria-hidden />
            <div className="h-10 rounded bg-slate-100" aria-hidden />
            <div className="h-10 rounded bg-slate-100" aria-hidden />
            <div className="h-10 rounded bg-slate-100" aria-hidden />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="mx-auto w-full max-w-6xl px-6 pb-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h4 className="text-base font-semibold text-slate-900">Ready to explore CRO partners?</h4>
              <p className="mt-1 text-sm text-slate-600">Create your sponsor profile and get curated matches in minutes.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth?role=sponsor&mode=signup&new=1" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                Start as Sponsor
              </Link>
              <Link href="/auth?role=cro&mode=signup&new=1" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                Join as CRO
              </Link>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} CRO Finder. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-slate-700">Privacy</Link>
              <Link href="#" className="hover:text-slate-700">Terms</Link>
              <Link href="#" className="hover:text-slate-700">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
