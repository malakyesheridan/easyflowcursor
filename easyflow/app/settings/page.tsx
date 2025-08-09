import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getContext() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, businessId: null };
  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", user.id)
    .single();
  return { user, businessId: profile?.business_id as string | null };
}

async function getAuthenticatedBusinessId() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", user.id)
    .single();
  return (profile?.business_id as string | null) ?? null;
}

async function updateBusinessSettings(formData: FormData) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const businessId = await getAuthenticatedBusinessId();
  if (!businessId) return;

  const hours = formData.get("hours") as string;
  const emergencyNumber = formData.get("emergency_number") as string;

  const { data: biz } = await supabase
    .from("businesses")
    .select("settings")
    .eq("id", businessId)
    .single();

  const nextSettings = { ...(biz?.settings || {}), hours, emergency_number: emergencyNumber };
  await supabase.from("businesses").update({ settings: nextSettings }).eq("id", businessId);

  const webhook = process.env.MAKE_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ business_id: businessId, settings: nextSettings }),
      });
    } catch {}
  }
}

async function upsertFaq(formData: FormData) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const businessId = await getAuthenticatedBusinessId();
  if (!businessId) return;

  const id = (formData.get("id") as string | null) || null;
  const question = (formData.get("question") as string) || "";
  const response = (formData.get("response") as string) || "";
  const active = formData.get("active") === "on";

  if (id) {
    // Update only if FAQ belongs to this business
    await supabase
      .from("faqs")
      .update({ question, response, active })
      .eq("id", id)
      .eq("business_id", businessId);
  } else {
    await supabase.from("faqs").insert({ business_id: businessId, question, response, active });
  }
}

export default async function SettingsPage() {
  const { user, businessId } = await getContext();
  if (!user || !businessId) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("name,settings")
    .eq("id", businessId)
    .single();
  const { data: faqs } = await supabase
    .from("faqs")
    .select("id,question,response,active")
    .eq("business_id", businessId)
    .order("id");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-gray-600">Business: {biz?.name}</p>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-medium mb-3">Business Hours & Emergency</h2>
        <form action={updateBusinessSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Business Hours</label>
            <input
              name="hours"
              defaultValue={(biz?.settings?.hours as string) || "Mon-Fri 9am-5pm"}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Emergency Transfer Number</label>
            <input
              name="emergency_number"
              defaultValue={(biz?.settings?.emergency_number as string) || ""}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <button className="px-4 py-2 rounded bg-gray-800 text-white">Save Settings</button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-medium mb-3">FAQs</h2>
        <div className="space-y-4">
          {(faqs || []).map((f) => (
            <form
              key={f.id}
              action={upsertFaq}
              className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start p-3 border rounded"
            >
              <input type="hidden" name="id" value={f.id} />
              <input
                name="question"
                defaultValue={f.question}
                className="md:col-span-2 border rounded px-2 py-1"
              />
              <textarea
                name="response"
                defaultValue={f.response}
                className="md:col-span-3 border rounded px-2 py-1"
              />
              <label className="flex items-center space-x-2 md:col-span-1">
                <input type="checkbox" name="active" defaultChecked={f.active} />
                <span>Active</span>
              </label>
              <div className="md:col-span-6">
                <button className="px-3 py-1 rounded bg-gray-800 text-white">Save</button>
              </div>
            </form>
          ))}

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Add FAQ</h3>
            <form action={upsertFaq} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start p-3 border rounded">
              <input name="question" placeholder="Question" className="md:col-span-2 border rounded px-2 py-1" />
              <textarea name="response" placeholder="Response" className="md:col-span-3 border rounded px-2 py-1" />
              <label className="flex items-center space-x-2 md:col-span-1">
                <input type="checkbox" name="active" defaultChecked />
                <span>Active</span>
              </label>
              <div className="md:col-span-6">
                <button className="px-3 py-1 rounded bg-gray-800 text-white">Add</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}