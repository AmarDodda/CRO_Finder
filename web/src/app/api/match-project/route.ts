// // src/app/api/match-project/route.ts
// import { NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// const HF_TOKEN  = process.env.HF_TOKEN!;
// const HF_MODEL  = process.env.HF_MODEL ?? "BAAI/bge-small-en-v1.5";
// const EMBED_DIM = Number(process.env.EMBED_DIM ?? "384");

// function l2norm(v: number[]) {
//   const s = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
//   return v.map((x) => x / s);
// }

// function clampText(s: string, max = 2000) {
//   return s.length > max ? s.slice(0, max) : s;
// }

// function projectToText(p: {
//   title: string;
//   description?: string | null;
//   therapy_area?: string | null;
//   phase?: string | null;
//   budget?: number | null;
// }) {
//   return clampText(
//     [
//       `Title: ${p.title}`,
//       p.description ? `Description: ${p.description}` : null,
//       p.therapy_area ? `Therapy area: ${p.therapy_area}` : null,
//       p.phase ? `Phase: ${p.phase}` : null,
//       p.budget ? `Budget: ${p.budget}` : null,
//     ]
//       .filter(Boolean)
//       .join("\n")
//   );
// }

// async function hfEmbedOnce(text: string, timeoutMs = 12000): Promise<number[]> {
//   const ctrl = new AbortController();
//   const timer = setTimeout(() => ctrl.abort(), timeoutMs);
//   try {
//     const r = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
//       method: "POST",
//       headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
//       body: JSON.stringify({ inputs: [text], options: { wait_for_model: true } }),
//       signal: ctrl.signal,
//     });
//     if (!r.ok) {
//       const msg = await r.text().catch(() => String(r.status));
//       throw new Error(`HF ${r.status} ${msg.slice(0, 240)}`);
//     }
//     const json = await r.json();
//     const vec: number[] = Array.isArray(json?.[0]) ? json[0] : json;
//     if (!Array.isArray(vec) || typeof vec[0] !== "number") throw new Error("Unexpected HF response");
//     if (vec.length !== EMBED_DIM) throw new Error(`dim mismatch: expected ${EMBED_DIM}, got ${vec.length}`);
//     return l2norm(vec);
//   } finally {
//     clearTimeout(timer);
//   }
// }

// async function embedText(text: string): Promise<number[]> {
//   const safe = clampText(text, 2000);
//   let delay = 600;
//   for (let i = 0; i < 3; i++) {
//     try {
//       return await hfEmbedOnce(safe);
//     } catch (e: any) {
//       const msg = String(e?.message || e);
//       const retriable =
//         msg.includes("504") ||
//         msg.includes("502") ||
//         msg.includes("429") ||
//         msg.toLowerCase().includes("timeout") ||
//         msg.toLowerCase().includes("aborted") ||
//         msg.toLowerCase().includes("econnreset");
//       if (!retriable || i === 2) throw new Error(`EmbeddingsUnavailable: ${msg}`);
//       await new Promise(r => setTimeout(r, delay));
//       delay *= 2;
//     }
//   }
//   throw new Error("EmbeddingsUnavailable");
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       project_id,
//       title, description, therapy_area, phase, budget,
//       country, specialties, k = 10, min_similarity = 0,
//       owner_id,
//     } = body as any;

//     // 1) Load or create project
//     let pid: string | undefined = project_id;
//     let projectRow:
//       | { id: string; title: string; description?: string | null; therapy_area?: string | null; phase?: string | null; budget?: number | null; embedding?: number[] | null }
//       | null = null;

//     if (pid) {
//       const { data, error } = await supabaseAdmin
//         .from("projects")
//         .select("id, title, description, therapy_area, phase, budget, embedding")
//         .eq("id", pid)
//         .single();
//       if (error) throw error;
//       projectRow = data;
//     } else {
//       if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
//       const { data, error } = await supabaseAdmin
//         .from("projects")
//         .insert([{ owner: owner_id ?? null, title, description, therapy_area, phase, budget }])
//         .select("id, title, description, therapy_area, phase, budget, embedding")
//         .single();
//       if (error) throw error;
//       projectRow = data;
//       pid = data.id;

//       if (owner_id) {
//         await supabaseAdmin
//           .from("user_profiles")
//           .update({ sponsor_onboarded: true })
//           .eq("id", owner_id)
//           .is("sponsor_onboarded", false);
//       }
//     }

//     // 2) Try embeddings (prefer cached). If unavailable, **do degraded keyword/trigram match**
//     let qvec: number[] | null = Array.isArray(projectRow?.embedding) ? projectRow!.embedding! : null;
//     let embeddingsOk = true;

//     if (!qvec) {
//       const textForEmbedding = projectToText(projectRow!);
//       try {
//         qvec = await embedText(textForEmbedding);
//         await supabaseAdmin.from("projects").update({ embedding: qvec }).eq("id", pid!);
//       } catch (e) {
//         embeddingsOk = false;
//       }
//     }

//     const countryParam =
//     country && String(country).trim().length ? String(country).trim() : null;

//     const specsParam =
//     Array.isArray(specialties) && specialties.length ? specialties : null;

//     if (embeddingsOk && qvec) {
//       // --- vector match RPC ---
//       const { data: rows, error: rpcError } = await supabaseAdmin.rpc('match_cros', {
//         query_vec: qvec,
//         project_id: null,
//         filter_country: countryParam,
//         filter_specialties: specsParam,
//         min_similarity,
//         k,
//       });
//       if (rpcError) throw rpcError;

//       const results = (rows as any[]).map((r) => {
//         const overlaps =
//           Array.isArray(r.specialties) && therapy_area
//             ? r.specialties.filter((s: string) => s.toLowerCase().includes(String(therapy_area).toLowerCase()))
//             : [];
//         const why = [
//           overlaps.length ? `Specialty overlap: ${overlaps.join(", ")}` : null,
//           country && r.country === country ? `Country match: ${country}` : null,
//           `High semantic match (similarity ${Number(r.similarity).toFixed(2)})`,
//         ]
//           .filter(Boolean)
//           .join(" • ");
//         return { ...r, rationale: why, mode: "semantic" };
//       });

//       return NextResponse.json({ project_id: pid, results });
//     }

//     // 3) **Degraded mode**: keyword + trigram similarity (no vectors needed)
//     // Make sure pg_trgm is enabled and helpful indexes exist (see notes below).
//     const query =
//       projectRow?.title ?? "" + " " + (projectRow?.therapy_area ?? "") + " " + (projectRow?.description ?? "");

//     // You can wrap this as a SQL function; here we use a simple RPC via SQL.
//     const { data: degraded, error: dErr } = await supabaseAdmin.rpc("match_cros_trgm", {
//       q: query,
//       filter_country: country ?? null,
//       filter_specialties: specialties ?? null,
//       k,
//     });
//     if (dErr) throw dErr;

//     const results = (degraded as any[]).map((r) => ({
//       ...r,
//       similarity: r.score, // rename for UI parity
//       rationale: [
//         country && r.country === country ? `Country match: ${country}` : null,
//         `Keyword/Trigram match (score ${Number(r.score).toFixed(2)})`,
//       ]
//         .filter(Boolean)
//         .join(" • "),
//       mode: "degraded",
//     }));

//     return NextResponse.json({ project_id: pid, results, degraded: true });
//   } catch (e: any) {
//     console.error(e);
//     const msg = String(e?.message || e);
//     return NextResponse.json({ error: msg.slice(0, 240) }, { status: 500 });
//   }
// }


// src/app/api/match-project/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

/** ──────────────────────────────────────────────────────────────────────────
 * Env & small helpers
 * ────────────────────────────────────────────────────────────────────────── */
const HF_TOKEN = process.env.HF_TOKEN!;
const HF_MODEL = process.env.HF_MODEL ?? "BAAI/bge-small-en-v1.5";
const EMBED_DIM = Number(process.env.EMBED_DIM ?? "384");

function l2norm(v: number[]) {
  const s = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / s);
}

function clampText(s: string, max = 2000) {
  return s.length > max ? s.slice(0, max) : s;
}

/** ──────────────────────────────────────────────────────────────────────────
 * Types & validation
 * ────────────────────────────────────────────────────────────────────────── */
const BodySchema = z.object({
  project_id: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  therapy_area: z.string().optional().nullable(),
  phase: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  country: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional().nullable(),
  k: z.number().int().min(1).max(50).default(10),
  min_similarity: z.number().min(0).max(1).default(0),
  owner_id: z.string().uuid().optional(),
});

type Body = z.infer<typeof BodySchema>;

type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  therapy_area: string | null;
  phase: string | null;
  budget: number | null;
  embedding: number[] | null;
};

const MatchRowSchema = z.object({
  cro_id: z.string().uuid(),
  name: z.string(),
  website: z.string().nullable(),
  country: z.string().nullable(),
  contact_email: z.string().nullable(),
  specialties: z.array(z.string()).nullable(),
  similarity: z.number(),
});

// type MatchRow = z.infer<typeof MatchRowSchema>;

const DegradedRowSchema = MatchRowSchema.extend({
  score: z.number().optional(), // RPC may return either score or similarity
});

/** ──────────────────────────────────────────────────────────────────────────
 * Text builder for embeddings
 * ────────────────────────────────────────────────────────────────────────── */
function projectToText(p: {
  title: string;
  description?: string | null;
  therapy_area?: string | null;
  phase?: string | null;
  budget?: number | null;
}) {
  return clampText(
    [
      `Title: ${p.title}`,
      p.description ? `Description: ${p.description}` : null,
      p.therapy_area ? `Therapy area: ${p.therapy_area}` : null,
      p.phase ? `Phase: ${p.phase}` : null,
      p.budget != null ? `Budget: ${p.budget}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

/** ──────────────────────────────────────────────────────────────────────────
 * HF embedding with retries (no any)
 * ────────────────────────────────────────────────────────────────────────── */
async function hfEmbedOnce(text: string, timeoutMs = 12_000): Promise<number[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: [text], options: { wait_for_model: true } }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const msg = await r.text().catch(() => String(r.status));
      throw new Error(`HF ${r.status} ${msg.slice(0, 240)}`);
    }
    const json = (await r.json()) as unknown;
    const vec = Array.isArray(json) && Array.isArray(json[0]) ? (json[0] as unknown[]) : (json as unknown[]);
    if (!Array.isArray(vec) || typeof vec[0] !== "number") throw new Error("Unexpected HF response");
    if (vec.length !== EMBED_DIM) throw new Error(`dim mismatch: expected ${EMBED_DIM}, got ${vec.length}`);
    return l2norm(vec as number[]);
  } finally {
    clearTimeout(timer);
  }
}

async function embedText(text: string): Promise<number[]> {
  const safe = clampText(text, 2000);
  let delay = 600;
  for (let i = 0; i < 3; i++) {
    try {
      return await hfEmbedOnce(safe);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const retriable =
        msg.includes("504") ||
        msg.includes("502") ||
        msg.includes("429") ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("aborted") ||
        msg.toLowerCase().includes("econnreset");
      if (!retriable || i === 2) throw new Error(`EmbeddingsUnavailable: ${msg}`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error("EmbeddingsUnavailable");
}

/** ──────────────────────────────────────────────────────────────────────────
 * Route
 * ────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    const body = BodySchema.parse((await req.json()) as unknown) as Body;

    const {
      project_id,
      title,
      description,
      therapy_area,
      phase,
      budget,
      country,
      specialties,
      k,
      min_similarity,
      owner_id,
    } = body;

    // 1) Load or create project
    let pid: string | undefined = project_id;
    let projectRow: ProjectRow | null = null;

    if (pid) {
      const { data, error } = await supabaseAdmin
        .from("projects")
        .select("id, title, description, therapy_area, phase, budget, embedding")
        .eq("id", pid)
        .single<ProjectRow>();
      if (error) throw error;
      projectRow = data;
    } else {
      if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
      const { data, error } = await supabaseAdmin
        .from("projects")
        .insert([{ owner: owner_id ?? null, title, description: description ?? null, therapy_area: therapy_area ?? null, phase: phase ?? null, budget: budget ?? null }])
        .select("id, title, description, therapy_area, phase, budget, embedding")
        .single<ProjectRow>();
      if (error) throw error;
      projectRow = data;
      pid = data.id;

      if (owner_id) {
        await supabaseAdmin
          .from("user_profiles")
          .update({ sponsor_onboarded: true })
          .eq("id", owner_id)
          .is("sponsor_onboarded", false);
      }
    }

    // 2) Try embeddings (prefer cached). If unavailable, fall back to degraded mode
    let qvec: number[] | null = Array.isArray(projectRow?.embedding) ? (projectRow!.embedding as number[]) : null;
    let embeddingsOk = true;

    if (!qvec) {
      const textForEmbedding = projectToText({
        title: projectRow!.title,
        description: projectRow!.description,
        therapy_area: projectRow!.therapy_area,
        phase: projectRow!.phase,
        budget: projectRow!.budget ?? undefined,
      });
      try {
        qvec = await embedText(textForEmbedding);
        await supabaseAdmin.from("projects").update({ embedding: qvec }).eq("id", pid!);
      } catch {
        embeddingsOk = false;
      }
    }

    const countryParam = country && String(country).trim().length ? String(country).trim() : null;
    const specsParam = Array.isArray(specialties) && specialties.length ? specialties : null;

    if (embeddingsOk && qvec) {
      // 2a) Vector match RPC
      const { data: rows, error: rpcError } = await supabaseAdmin.rpc("match_cros", {
        query_vec: qvec,
        project_id: null,
        filter_country: countryParam,
        filter_specialties: specsParam,
        min_similarity,
        k,
      });

      if (rpcError) throw rpcError;

      const parsed = z.array(MatchRowSchema).parse(rows ?? []);
      const results = parsed.map((r) => {
        const overlaps =
          Array.isArray(r.specialties) && therapy_area
            ? r.specialties.filter((s) => s.toLowerCase().includes(String(therapy_area).toLowerCase()))
            : [];
        const why = [
          overlaps.length ? `Specialty overlap: ${overlaps.join(", ")}` : null,
          country && r.country === country ? `Country match: ${country}` : null,
          `High semantic match (similarity ${Number(r.similarity).toFixed(2)})`,
        ]
          .filter(Boolean)
          .join(" • ");
        return { ...r, rationale: why, mode: "semantic" as const };
      });

      return NextResponse.json({ project_id: pid, results });
    }

    // 3) Degraded mode: keyword + trigram similarity (no vectors)
    const query =
      `${projectRow?.title ?? ""} ${projectRow?.therapy_area ?? ""} ${projectRow?.description ?? ""}`.trim();

    const { data: degraded, error: dErr } = await supabaseAdmin.rpc("match_cros_trgm", {
      q: query,
      filter_country: countryParam,
      filter_specialties: specsParam,
      k,
    });
    if (dErr) throw dErr;

    const parsedDegraded = z.array(DegradedRowSchema).parse(degraded ?? []);
    const results = parsedDegraded.map((r) => {
      const sim = r.similarity ?? r.score ?? 0;
      const rationale = [
        country && r.country === country ? `Country match: ${country}` : null,
        `Keyword/Trigram match (score ${Number(sim).toFixed(2)})`,
      ]
        .filter(Boolean)
        .join(" • ");
      return { ...r, similarity: sim, rationale, mode: "degraded" as const };
    });

    return NextResponse.json({ project_id: pid, results, degraded: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg.slice(0, 240) }, { status: 500 });
  }
}

