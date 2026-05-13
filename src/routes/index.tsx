import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Send, Activity } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — EstateCRM" },
      { name: "description", content: "Dashboard CRM immobiliare con statistiche su lead e agenti." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ),
});

const COLORS = ["oklch(0.55 0.22 25)", "oklch(0.65 0.16 150)", "oklch(0.75 0.15 75)", "oklch(0.55 0.18 260)", "oklch(0.6 0.18 320)"];

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tone || "bg-primary/10 text-primary"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.stats(),
    refetchInterval: 30000,
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Panoramica di lead, agenti e attività.</p>
      </header>

      {error && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Impossibile contattare il backend. Controlla Impostazioni → URL API. ({String((error as Error).message)})
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Lead totali" value={data?.total_leads ?? (isLoading ? "…" : 0)} />
        <StatCard icon={UserCheck} label="Nuovi lead" value={data?.new_leads ?? (isLoading ? "…" : 0)} tone="bg-success/10 text-[oklch(0.5_0.16_150)]" />
        <StatCard icon={Send} label="Gestiti via WhatsApp" value={data?.contacted_leads ?? (isLoading ? "…" : 0)} />
        <StatCard icon={Clock} label="Lead in attesa" value={data?.pending_leads ?? (isLoading ? "…" : 0)} tone="bg-warning/10 text-[oklch(0.55_0.15_75)]" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lead per portale</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.per_source || []} dataKey="count" nameKey="source" outerRadius={90} label>
                  {(data?.per_source || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lead per agente</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.per_agent || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agent" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(0.55 0.22 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Attività recente</CardTitle>
        </CardHeader>
        <CardContent>
          {(!data?.recent_activity || data.recent_activity.length === 0) && (
            <p className="text-sm text-muted-foreground">Nessuna attività recente.</p>
          )}
          <ul className="divide-y">
            {data?.recent_activity?.map((a, i) => (
              <li key={i} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{a.type}</div>
                  <div className="text-muted-foreground">{a.detail}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString("it-IT")}</div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
