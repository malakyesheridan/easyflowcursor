import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Transcript from "@/components/Transcript";

const PAGE_SIZE_DEFAULT = 20;

async function getBusinessId() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", user.id)
    .single();
  return profile?.business_id as string | null;
}

export default async function CallsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const businessId = await getBusinessId();
  if (!businessId) redirect("/login");

  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const pageSize = PAGE_SIZE_DEFAULT;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const outcome = sp.outcome;
  const q = sp.q?.trim();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("calls")
    .select("id,timestamp,caller_number,duration,outcome,audio_url,transcript,tags", { count: "exact" })
    .eq("business_id", businessId);

  if (outcome) query = query.eq("outcome", outcome);
  if (q) query = query.textSearch("transcript", q, { type: "plain" });

  const { data: calls, count } = await query
    .order("timestamp", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Calls</h1>
        <form className="flex items-center gap-2" action="/calls" method="get">
          <input name="q" defaultValue={q || ""} placeholder="Search transcript" className="border rounded px-2 py-1" />
          <select name="outcome" defaultValue={outcome || ""} className="border rounded px-2 py-1">
            <option value="">All outcomes</option>
            <option value="answered">Answered</option>
            <option value="missed">Missed</option>
            <option value="transferred">Transferred</option>
          </select>
          <button className="px-3 py-1 rounded bg-gray-800 text-white">Filter</button>
        </form>
      </div>

      <div className="rounded-xl border bg-white divide-y">
        {(calls || []).map((c) => (
          <div key={c.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{new Date(c.timestamp).toLocaleString()}</div>
              <div className="text-sm text-gray-600">{c.outcome}</div>
            </div>
            <div className="text-sm text-gray-700">Caller: {c.caller_number} • Duration: {Math.round((c.duration || 0) / 60)} min</div>
            <details>
              <summary className="cursor-pointer text-sm text-blue-600">Transcript</summary>
              <div className="mt-2 text-sm text-gray-800">
                <Transcript text={c.transcript || ""} keywords={q ? [q] : []} />
              </div>
            </details>
            {c.audio_url ? (
              <div>
                <audio src={c.audio_url} controls className="w-full" />
                <a href={c.audio_url} download className="text-sm text-blue-600">Download audio</a>
              </div>
            ) : null}
            {Array.isArray(c.tags) && c.tags.length > 0 ? (
              <div className="text-xs text-gray-600">Tags: {c.tags.join(", ")}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <div className="space-x-2">
          <a className={`px-3 py-1 rounded border ${page === 1 ? "opacity-50 pointer-events-none" : ""}`} href={`?page=${page - 1}${outcome ? `&outcome=${outcome}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Prev</a>
          <a className={`px-3 py-1 rounded border ${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`} href={`?page=${page + 1}${outcome ? `&outcome=${outcome}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Next</a>
        </div>
      </div>
    </div>
  );
}