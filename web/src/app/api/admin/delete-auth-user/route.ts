// // app/api/admin/delete-auth-user/route.ts
// import { NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabaseAdmin"; // must use service_role key

// export async function POST(req: Request) {
//   const { userId } = await req.json(); // the auth.user.id
//   const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
//   if (error) return NextResponse.json({ error: error.message }, { status: 400 });
//   return NextResponse.json({ ok: true });
// }


// app/api/admin/delete-auth-user/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // must use service_role key
import { z } from "zod";

const BodySchema = z.object({
  userId: z.string().uuid(), // enforce valid UUID
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse((await req.json()) as unknown);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(body.userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
