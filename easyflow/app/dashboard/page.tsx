import { createSupabaseServerClient } from "@/lib/supabase/server";
import { subDays, startOfDay, format } from "date-fns";
import { redirect } from "next/navigation";
import { VolumeChart, OutcomePie } from "@/components/Charts";

async function getBusinessId() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("business_id, role, email")
    .eq("id", user.id)
    .single();
  return profile?.business_id as string | null;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const businessId = await getBusinessId();
  if (!businessId) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const range = (sp.range === "30d" ? 30 : 7);
  const fromDate = startOfDay(subDays(new Date(), range - 1));

  // Fetch calls within range
  const { data: calls } = await supabase
    .from("calls")
    .select("id,timestamp,duration,outcome")
    .eq("business_id", businessId)
    .gte("timestamp", fromDate.toISOString())
    .order("timestamp", { ascending: true });

  const totalCalls = calls?.length ?? 0;
  const answered = calls?.filter((c) => c.outcome === "answered").length ?? 0;
  const missed = calls?.filter((c) => c.outcome === "missed").length ?? 0;
  const transferred = calls?.filter((c) => c.outcome === "transferred").length ?? 0;
  const totalMinutes = (calls?.reduce((acc, c) => acc + (c.duration ?? 0), 0) ?? 0) / 60;

  const answeredPct = totalCalls ? Math.round((answered / totalCalls) * 100) : 0;
  const missedPct = totalCalls ? Math.round((missed / totalCalls) * 100) : 0;

  // Build daily series
  const days = Array.from({ length: range }).map((_, i) => format(subDays(new Date(), range - 1 - i), "MM/dd"));
  const volumeByDay: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
  for (const call of calls ?? []) {
    const d = format(new Date(call.timestamp as string), "MM/dd");
    if (volumeByDay[d] != null) volumeByDay[d] += 1;
  }
  const chartData = days.map((d) => ({ date: d, calls: volumeByDay[d] }));

  const outcomeData = [
    { outcome: "answered", value: answered },
    { outcome: "missed", value: missed },
    { outcome: "transferred", value: transferred },
  ];

  // Simple estimated value delivered (placeholder): answered calls * $5 per call
  const estimatedValue = answered * 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-gray-600">Overview for last {range} days</p>
        </div>
        <div>
          <a href="?range=7d" className={`px-3 py-1 border rounded mr-2 ${range === 7 ? "bg-gray-900 text-white" : ""}`}>7d</a>
          <a href="?range=30d" className={`px-3 py-1 border rounded ${range === 30 ? "bg-gray-900 text-white" : ""}`}>30d</a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Calls" value={totalCalls} />
        <MetricCard title="Answered %" value={`${answeredPct}%`} />
        <MetricCard title="Missed %" value={`${missedPct}%`} />
        <MetricCard title="Minutes Used" value={totalMinutes.toFixed(1)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-white p-4">
          <h2 className="font-medium mb-3">Call Volume</h2>
          <VolumeChart data={chartData} />
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-medium mb-3">Outcomes</h2>
          <OutcomePie data={outcomeData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-white p-4 lg:col-span-1">
          <h2 className="font-medium mb-3">Estimated Value</h2>
          <div className="text-3xl font-semibold">${estimatedValue.toFixed(2)}</div>
          <p className="text-gray-600 mt-2 text-sm">Placeholder estimate. Configure ROI in Settings.</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}