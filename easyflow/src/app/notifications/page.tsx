import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type MissedCall = { id: string; timestamp: string; caller_number: string | null; tags: string[] | null };
type FeedbackRow = { id: string; call_id: string; rating: number | null; notes: string | null };

async function getContext() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, businessId: null };
  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", user.id)
    .single();
  return { user, businessId: profile?.business_id as string | null };
}

async function saveFeedback(formData: FormData) {
  "use server";
  const supabase = createSupabaseServerClient();
  const callId = formData.get("call_id") as string;
  const rating = Number(formData.get("rating"));
  const notes = (formData.get("notes") as string) || null;

  // Upsert by call_id (simple logic: insert new row)
  await supabase.from("feedback").insert({ call_id: callId, rating, notes }).select();
}

export default async function NotificationsPage() {
  const { user, businessId } = await getContext();
  if (!user || !businessId) redirect("/login");

  const supabase = createSupabaseServerClient();
  const { data: missed } = await supabase
    .from("calls")
    .select("id,timestamp,caller_number,tags")
    .eq("business_id", businessId)
    .eq("outcome", "missed")
    .order("timestamp", { ascending: false })
    .limit(50);

  const { data: feedback } = await supabase
    .from("feedback")
    .select("id,call_id,rating,notes");

  const feedbackByCall = new Map<string, FeedbackRow>((feedback as FeedbackRow[] | null || []).map((f) => [f.call_id, f]));
  const missedList: MissedCall[] = (missed as MissedCall[] | null) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="rounded-xl border bg-white divide-y">
        {missedList.map((c) => {
          const fb = feedbackByCall.get(c.id);
          return (
            <div key={c.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Missed: {new Date(c.timestamp).toLocaleString()}</div>
                <div className="text-sm text-gray-600">{c.caller_number}</div>
              </div>
              {Array.isArray(c.tags) && c.tags.length > 0 ? (
                <div className="text-xs text-gray-600">Reason: {c.tags[0]}</div>
              ) : null}
              <div>
                {fb ? (
                  <div className="text-sm text-green-700">Feedback: {fb.rating}/5 {fb.notes ? `- ${fb.notes}` : ""}</div>
                ) : (
                  <form action={saveFeedback} className="flex items-center space-x-2 text-sm">
                    <input type="hidden" name="call_id" value={c.id} />
                    <select name="rating" className="border rounded px-2 py-1">
                      {[1,2,3,4,5].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input name="notes" placeholder="Notes" className="border rounded px-2 py-1" />
                    <button className="px-3 py-1 rounded bg-gray-800 text-white">Save</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}