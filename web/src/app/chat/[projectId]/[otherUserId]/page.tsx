// // app/chat/[projectId]/[otherUserId]/page.tsx
// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams } from "next/navigation";
// import { supabaseBrowser } from "@/lib/supabaseBrowser";

// type Msg = {
//   id: string;
//   sender: string | null;
//   recipient: string | null;
//   project_id: string;
//   message: string;
//   sent_at: string;
//   read_at: string | null;
// };

// type Role = "sponsor" | "cro" | null;

// export default function ChatPage() {
//   const { projectId, otherUserId } = useParams<{ projectId: string; otherUserId: string }>();
//   const supabase = useMemo(supabaseBrowser, []);
//   const [me, setMe] = useState<string | null>(null);
//   const [role, setRole] = useState<Role>(null);
//   const [msgs, setMsgs] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [status, setStatus] = useState<string | null>(null);
//   const [resolvingRole, setResolvingRole] = useState(true);
//   const listRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLTextAreaElement>(null);

//   // ---- Robust role resolution ----
//   useEffect(() => {
//     let unsub: (() => void) | undefined;

//     async function resolveRole() {
//       setResolvingRole(true);
//       const { data: { user } } = await supabase.auth.getUser();
//       const uid = user?.id ?? null;
//       setMe(uid);

//       let resolved: Role = null;

//       if (uid) {
//         // 1) Try user_profiles.role (normalize case)
//         const { data: profile } = await supabase
//           .from("user_profiles")
//           .select("role")
//           .eq("id", uid)
//           .maybeSingle();

//         const profRole = typeof profile?.role === "string" ? profile.role.toLowerCase() : null;
//         if (profRole === "sponsor" || profRole === "cro") {
//           resolved = profRole as Role;
//         } else {
//           // 2) Infer by ownership
//           // Owns any CRO?
//           const { count: croCount } = await supabase
//             .from("cros")
//             .select("*", { count: "exact", head: true })
//             .eq("owner", uid);

//           if ((croCount ?? 0) > 0) {
//             resolved = "cro";
//           } else {
//             // Owns any project?
//             const { count: projCount } = await supabase
//               .from("projects")
//               .select("*", { count: "exact", head: true })
//               .eq("owner", uid);

//             if ((projCount ?? 0) > 0) {
//               resolved = "sponsor";
//             }
//           }
//         }
//       }

//       setRole(resolved);
//       setResolvingRole(false);

//       const { data } = supabase.auth.onAuthStateChange((_e, session) => {
//         const newUid = session?.user?.id ?? null;
//         setMe(newUid);
//         // re-run resolution if auth state changes
//         if (newUid) resolveRole();
//         else {
//           setRole(null);
//           setResolvingRole(false);
//         }
//       });
//       unsub = () => data.subscription.unsubscribe();
//     }

//     resolveRole();

//     return () => unsub?.();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [supabase]);

//   // ---- Load history + subscribe (after me is known so alignment is correct) ----
//   useEffect(() => {
//     if (!projectId || !otherUserId || !me) return;
//     const pid = String(projectId);
//     const other = String(otherUserId);

//     async function load() {
//       const { data, error } = await supabase
//         .from("contacts")
//         .select("id,sender,recipient,project_id,message,sent_at,read_at")
//         .eq("project_id", pid)
//         .or(`and(sender.eq.${me},recipient.eq.${other}),and(sender.eq.${other},recipient.eq.${me})`)
//         .order("sent_at", { ascending: true });

//       if (!error) setMsgs((data || []) as Msg[]);
//     }
//     load();

//     const ch = supabase
//       .channel(`contacts:${pid}`)
//       .on(
//         "postgres_changes",
//         { event: "INSERT", schema: "public", table: "contacts", filter: `project_id=eq.${pid}` },
//         (payload) => {
//           const m = payload.new as Msg;
//           if (
//             (m.sender === me && m.recipient === other) ||
//             (m.sender === other && m.recipient === me)
//           ) {
//             setMsgs((prev) => {
//               if (prev.some((x) => x.id === m.id)) return prev; // dedupe vs optimistic
//               return [...prev, m];
//             });
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(ch);
//     };
//   }, [supabase, projectId, otherUserId, me]);

//   // Auto-scroll on new messages
//   useEffect(() => {
//     listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
//   }, [msgs.length]);

//   // ---- Send message (optimistic + server) ----
//   async function send() {
//     setStatus(null);
//     if (!me) {
//       setStatus("You’re not signed in. Open /auth and sign in.");
//       return;
//     }
//     const message = text.trim();
//     if (!message) return;

//     const optimistic: Msg = {
//       id: `temp-${Date.now()}`,
//       sender: me,
//       recipient: String(otherUserId),
//       project_id: String(projectId),
//       message,
//       sent_at: new Date().toISOString(),
//       read_at: null,
//     };
//     setMsgs((prev) => [...prev, optimistic]);
//     setText("");
//     inputRef.current?.focus();

//     const r = await fetch("/api/chat/send", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         project_id: String(projectId),
//         recipient: String(otherUserId),
//         message,
//       }),
//     });
//     const j = await r.json().catch(() => ({}));

//     if (!r.ok) {
//       // rollback optimistic on failure
//       setMsgs((prev) => prev.filter((m) => m.id !== optimistic.id));
//       setStatus(`Send failed: ${j.error || r.statusText}`);
//       return;
//     }

//     if (j?.message?.id) {
//       // replace optimistic with server row
//       setMsgs((prev) => prev.map((m) => (m.id === optimistic.id ? (j.message as Msg) : m)));
//     }
//   }

//   // Enter sends; Shift+Enter newline; Cmd/Ctrl+Enter sends
//   function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
//     const isEnter = e.key === "Enter";
//     if ((isEnter && !e.shiftKey) || (isEnter && (e.metaKey || e.ctrlKey))) {
//       e.preventDefault();
//       send();
//     }
//   }

//   if (!projectId || !otherUserId) {
//     return <div className="p-6 text-rose-700">Missing route params.</div>;
//   }

//   // Group by day
//   const groupByDay = (rows: Msg[]) => {
//     const fmt = (d: Date) =>
//       d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
//     const map = new Map<string, Msg[]>();
//     rows.forEach((m) => {
//       const k = fmt(new Date(m.sent_at));
//       map.set(k, [...(map.get(k) || []), m]);
//     });
//     return Array.from(map.entries());
//   };

//   // Back link — robust & deterministic
//   const backHref =
//     role === "sponsor"
//       ? "/sponsor/me"
//       : role === "cro"
//       ? "/cros/me"
//       : `/matches?projectId=${projectId}`;
//   const backLabel =
//     role === "sponsor"
//       ? "← Back to Sponsor Dashboard"
//       : role === "cro"
//       ? "← Back to CRO Dashboard"
//       : "← Back";

//   return (
//     <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
//       {/* Sticky header */}
//       <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 px-6 py-4 text-white">
//         <div className="mx-auto flex max-w-4xl items-center justify-between">
//           <a
//             href={backHref}
//             className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
//           >
//             {resolvingRole ? "← Back" : backLabel}
//           </a>
//           <div className="text-sm opacity-80">
//             Project <span className="font-semibold">{String(projectId).slice(0, 8)}…</span>
//           </div>
//         </div>
//       </div>

//       {/* Chat area */}
//       <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-4xl flex-col gap-3 px-6 py-4 md:h-[calc(100dvh-10rem)]">
//         {status && (
//           <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
//             {status}
//           </div>
//         )}

//         <div
//           ref={listRef}
//           className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur"
//         >
//           {msgs.length === 0 ? (
//             <div className="flex h-full items-center justify-center text-sm text-slate-500">
//               No messages yet.
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {groupByDay(msgs).map(([day, rows]) => (
//                 <section key={day} className="space-y-3">
//                   <div className="relative my-2 flex items-center justify-center">
//                     <div className="h-px w-full bg-slate-200" />
//                     <span className="absolute inline-flex items-center rounded-full bg-white px-3 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">
//                       {day}
//                     </span>
//                   </div>

//                   {rows.map((m) => {
//                     const mine = me && m.sender === me;
//                     const time = new Date(m.sent_at).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     });

//                     return (
//                       <div
//                         key={m.id}
//                         className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
//                       >
//                         {!mine && <Avatar seed={m.sender || m.recipient || "x"} className="order-1" />}
//                         <div className={`max-w-[75%] md:max-w-[65%] ${mine ? "order-2 text-right" : "order-2"}`}>
//                           <div
//                             className={`inline-block rounded-2xl px-3 py-2 text-sm shadow-sm ${
//                               mine
//                                 ? "bg-gradient-to-r from-sky-600 to-violet-600 text-white"
//                                 : "bg-slate-100 text-slate-900"
//                             }`}
//                           >
//                             {m.message}
//                           </div>
//                           <div className={`mt-1 text-[10px] ${mine ? "text-slate-400" : "text-slate-500"}`}>
//                             {time}
//                           </div>
//                         </div>
//                         {mine && <Avatar seed={m.sender || "me"} className="order-3" />}
//                       </div>
//                     );
//                   })}
//                 </section>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Composer */}
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             send();
//           }}
//           className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur"
//         >
//           <div className="flex items-end gap-2">
//             <textarea
//               ref={inputRef}
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               onKeyDown={handleKeyDown}
//               rows={1}
//               placeholder="Type a message…"
//               className="max-h-40 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-5 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-300"
//             />
//             <button
//               type="submit"
//               className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
//             >
//               Send
//             </button>
//           </div>
//           <div className="mt-1 text-[10px] text-slate-500">
//             Press <kbd className="rounded border px-1">Enter</kbd> to send •{" "}
//             <kbd className="rounded border px-1">Shift</kbd>+<kbd className="rounded border px-1">Enter</kbd> for newline
//           </div>
//         </form>
//       </div>
//     </main>
//   );
// }

// function Avatar({ seed, className = "" }: { seed: string; className?: string }) {
//   const initials = (seed?.match(/[A-Z0-9]/gi)?.slice(0, 2).join("") || "US").toUpperCase();
//   return (
//     <div
//       className={`h-7 w-7 shrink-0 select-none rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-[11px] font-semibold text-white shadow ${className} flex items-center justify-center`}
//       aria-hidden
//     >
//       {initials}
//     </div>
//   );
// }


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Msg = {
  id: string;
  sender: string | null;
  recipient: string | null;
  project_id: string;
  message: string;
  sent_at: string;
  read_at: string | null;
};

export default function ChatPage() {
  const { projectId: rawPid, otherUserId: rawOther } =
    useParams<{ projectId: string; otherUserId: string }>();

  const projectId = String(rawPid || "");
  const otherUserId = String(rawOther || "");
  const supabase = useMemo(supabaseBrowser, []);

  const [me, setMe] = useState<string | null>(null);
  const [backHref, setBackHref] = useState<string>("/sponsor/me"); // default
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- Auth (single listener) ---------- */
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMe(user?.id ?? null);
      const { data } = supabase.auth.onAuthStateChange((_e, s) => {
        setMe(s?.user?.id ?? null);
      });
      unsub = () => data.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, [supabase]);

  /* ---------- Decide back link by MY ownership (simple & reliable) ---------- */
  useEffect(() => {
    let cancelled = false;
    async function resolveBack() {
      if (!me) return;
      const { count: iOwnCro } = await supabase
        .from("cros")
        .select("*", { head: true, count: "exact" })
        .eq("owner", me);
      if (!cancelled) {
        setBackHref((iOwnCro ?? 0) > 0 ? "/cros/me" : "/sponsor/me");
      }
    }
    resolveBack();
    return () => {
      cancelled = true;
    };
  }, [me, supabase]);

  /* ---------- Load history + realtime strictly for this two-person thread ---------- */
  useEffect(() => {
    if (!projectId || !otherUserId || !me) return;

    async function load() {
      const { data, error } = await supabase
        .from("contacts")
        .select("id,sender,recipient,project_id,message,sent_at,read_at")
        .eq("project_id", projectId)
        .or(
          `and(sender.eq.${me},recipient.eq.${otherUserId}),and(sender.eq.${otherUserId},recipient.eq.${me})`
        )
        .order("sent_at", { ascending: true });

      if (!error) {
        // filter out legacy/null rows so they don't break alignment
        const clean = (data || []).filter((m) => m.sender && m.recipient) as Msg[];
        setMsgs(clean);
      }
    }
    load();

    // realtime on project; we still gate by both participants in callback
    const ch = supabase
      .channel(`contacts:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contacts", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const m = payload.new as Msg;
          if (
            m.sender &&
            m.recipient &&
            ((m.sender === me && m.recipient === otherUserId) ||
              (m.sender === otherUserId && m.recipient === me))
          ) {
            setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, projectId, otherUserId, me]);

  /* ---------- Auto-scroll on new messages ---------- */
  useEffect(() => {
    listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs.length]);

  /* ---------- Send (optimistic + server) ---------- */
  async function send() {
    setStatus(null);
    if (!me) {
      setStatus("You’re not signed in. Open /auth and sign in.");
      return;
    }
    const message = text.trim();
    if (!message) return;

    // optimistic bubble on the RIGHT
    const optimistic: Msg = {
      id: `temp-${Date.now()}`,
      sender: me,
      recipient: otherUserId,
      project_id: projectId,
      message,
      sent_at: new Date().toISOString(),
      read_at: null,
    };
    setMsgs((prev) => [...prev, optimistic]);
    setText("");
    inputRef.current?.focus();

    const r = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, recipient: otherUserId, message }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      // rollback if server failed
      setMsgs((prev) => prev.filter((m) => m.id !== optimistic.id));
      setStatus(`Send failed: ${j.error || r.statusText}`);
    }
    // If your API returns the inserted row, you can replace optimistic with server row here.
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!projectId || !otherUserId) {
    return <div className="p-6 text-rose-700">Missing route params.</div>;
  }

  // Helper: group messages by day for nicer separators
  const groupByDay = (rows: Msg[]) => {
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    const map = new Map<string, Msg[]>();
    rows.forEach((m) => {
      const k = fmt(new Date(m.sent_at));
      map.set(k, [...(map.get(k) || []), m]);
    });
    return Array.from(map.entries());
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-white text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <a
            href={backHref}
            className="inline-flex min-w-[16rem] items-center justify-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
          >
            {backHref === "/cros/me" ? "← Back to CRO Dashboard" : "← Back to Sponsor Dashboard"}
          </a>
          <div className="text-sm opacity-80">
            Project <span className="font-semibold">{projectId.slice(0, 8)}…</span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-4xl flex-col gap-3 px-6 py-4 md:h-[calc(100dvh-10rem)]">
        {status && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {status}
          </div>
        )}

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur"
        >
          {msgs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No messages yet.</div>
          ) : (
            <div className="space-y-6">
              {groupByDay(msgs).map(([day, rows]) => (
                <section key={day} className="space-y-3">
                  <div className="relative my-2 flex items-center justify-center">
                    <div className="h-px w-full bg-slate-200" />
                    <span className="absolute inline-flex items-center rounded-full bg-white px-3 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">
                      {day}
                    </span>
                  </div>

                  {rows
                    .filter((m) => m.sender && m.recipient)
                    .map((m) => {
                      const isMine = me !== null && m.sender === me; // <- SINGLE SOURCE OF TRUTH
                      const time = new Date(m.sent_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          {!isMine && <Avatar seed={m.sender!} className="order-1" />}
                          <div
                            className={`order-2 max-w-[75%] md:max-w-[65%] ${
                              isMine ? "ml-auto text-right" : "mr-auto"
                            }`}
                          >
                            <div
                              className={`inline-block rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                isMine
                                  ? "bg-gradient-to-r from-sky-600 to-violet-600 text-white"
                                  : "bg-slate-100 text-slate-900"
                              }`}
                            >
                              {m.message}
                            </div>
                            <div className={`mt-1 text-[10px] ${isMine ? "text-slate-400" : "text-slate-500"}`}>
                              {time}
                            </div>
                          </div>
                          {isMine && <Avatar seed={m.sender!} className="order-3" />}
                        </div>
                      );
                    })}
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Type a message…"
              className="max-h-40 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-5 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-300"
            />
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
              Send
            </button>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Press <kbd className="rounded border px-1">Enter</kbd> to send •{" "}
            <kbd className="rounded border px-1">Shift</kbd>+<kbd className="rounded border px-1">Enter</kbd> for newline
          </div>
        </form>
      </div>
    </main>
  );
}

function Avatar({ seed, className = "" }: { seed: string; className?: string }) {
  const initials = (seed?.match(/[A-Z0-9]/gi)?.slice(0, 2).join("") || "US").toUpperCase();
  return (
    <div
      className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-[11px] font-semibold text-white shadow ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}


