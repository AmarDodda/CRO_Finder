import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";

type ContactRow = {
  id: string;
  sender: string | null;
  recipient: string | null;
  project_id: string | null;
  message: string;
  sent_at: string;
};

export default async function CroDashboard({
  params,
}: {
  // Next 15: params is a Promise
  params: Promise<{ id: string }>;
}) {
  const { id: croId } = await params;

  // Load CRO (and owner)
  const { data: cro, error: croErr } = await supabaseAdmin
    .from("cros")
    .select("id, name, owner, contact_email, country, website, specialties")
    .eq("id", croId)
    .single();

  if (croErr || !cro) {
    return <div className="p-6 text-red-600">CRO not found.</div>;
  }

  // Views count from notifications (type='visit')
  // Uses head+count for efficiency
  const { count: viewsCount } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("cro_id", croId)
    .eq("type", "visit");

  // Recent requests = contacts where recipient == CRO owner
  const { data: reqs } = await supabaseAdmin
    .from("contacts")
    .select("id,sender,recipient,project_id,message,sent_at")
    .eq("recipient", cro.owner)
    .order("sent_at", { ascending: false })
    .limit(25);

  // Load sender emails for display
  const senderIds = Array.from(new Set((reqs ?? []).map(r => r.sender).filter(Boolean))) as string[];
  let senderMap = new Map<string, { email: string | null }>();
  if (senderIds.length) {
    const { data: senders } = await supabaseAdmin
      .from("user_profiles")
      .select("id,email")
      .in("id", senderIds);
    senderMap = new Map((senders ?? []).map(s => [s.id, { email: s.email }]));
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{cro.name}</h1>
          <div className="text-sm text-gray-600">
            {cro.country ? <>Country: {cro.country} • </> : null}
            {cro.website ? (
              <>
                Website:{" "}
                <a className="underline" href={cro.website} target="_blank">
                  {cro.website}
                </a>
              </>
            ) : null}
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{viewsCount ?? 0}</div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Profile Views</div>
        </div>
      </div>

      {Array.isArray(cro.specialties) && cro.specialties.length > 0 && (
        <div className="text-sm">
          <b>Specialties:</b> {cro.specialties.join(", ")}
        </div>
      )}

      <div className="border rounded-lg">
        <div className="px-4 py-2 border-b bg-gray-50 font-medium">Recent Requests</div>
        <div className="divide-y">
          {(reqs as ContactRow[] | null)?.length ? (
            (reqs as ContactRow[]).map((r) => {
              const fromEmail = r.sender ? senderMap.get(r.sender)?.email : null;
              return (
                <div key={r.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      From: {fromEmail ?? r.sender ?? "Unknown"} • {new Date(r.sent_at).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      {r.project_id && r.sender && (
                        <Link
                          className="border px-3 py-1 rounded text-sm"
                          href={`/chat/${r.project_id}/${r.sender}`}
                        >
                          Open Chat
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">{r.message}</div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-sm text-gray-600">No requests yet.</div>
          )}
        </div>
      </div>

      <div className="text-sm">
        Want to preview your public profile?{" "}
        <Link className="underline" href={`/cros/${croId}`}>
          View profile page
        </Link>
      </div>
    </div>
  );
}
