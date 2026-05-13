import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { translateStatus, STATUS_OPTIONS } from "@/lib/i18n";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Lead — EstateCRM" },
      { name: "description", content: "Tutti i lead salvati nel sistema." },
    ],
  }),
  component: () => (
    <AppLayout>
      <LeadsPage />
    </AppLayout>
  ),
});

const ALL = "__all__";

const KNOWN_PORTALS = [
  { value: "idealista", label: "Idealista" },
  { value: "immobiliare", label: "Immobiliare" },
];

function statusColor(s?: string) {
  switch ((s || "").toLowerCase()) {
    case "new": return "bg-primary/10 text-primary";
    case "contacted": return "bg-success/10 text-[oklch(0.45_0.16_150)]";
    case "pending": return "bg-warning/10 text-[oklch(0.5_0.15_75)]";
    case "ignored": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

function normalize(v?: string) {
  return (v || "").toLowerCase().trim();
}

function LeadsPage() {
  const { data: leads, isLoading, error } = useQuery({ queryKey: ["leads"], queryFn: () => api.listLeads() });
  const { data: agents } = useQuery({ queryKey: ["agents"], queryFn: () => api.listAgents() });

  const [q, setQ] = useState("");
  const [portal, setPortal] = useState<string>(ALL);
  const [agent, setAgent] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);

  // Build portal options dynamically: known portals + any other source present in data
  const portalOptions = useMemo(() => {
    const known = new Set(KNOWN_PORTALS.map((p) => p.value));
    const others = new Set<string>();
    (leads || []).forEach((l) => {
      const s = normalize(l.source);
      if (s && !known.has(s)) others.add(s);
    });
    const opts = [...KNOWN_PORTALS];
    if (others.size > 0) opts.push({ value: "__others__", label: "Altri portali" });
    return opts;
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const term = q.toLowerCase();
    const knownPortalSet = new Set(KNOWN_PORTALS.map((p) => p.value));
    return leads.filter((l) => {
      const agentName = typeof l.agent === "string" ? l.agent : l.agent?.name;
      const agentCode = typeof l.agent === "string" ? l.agent : l.agent?.code;
      const src = normalize(l.source);
      const st = normalize(l.status) || "new";

      if (portal !== ALL) {
        if (portal === "__others__") {
          if (knownPortalSet.has(src) || !src) return false;
        } else if (src !== portal) {
          return false;
        }
      }
      if (agent !== ALL) {
        if (normalize(agentName) !== normalize(agent) && normalize(agentCode) !== normalize(agent)) return false;
      }
      if (status !== ALL && st !== status) return false;

      if (term) {
        const hay = [l.name, l.email, l.phone, l.property_ref, l.source, agentName]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .join(" ");
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [leads, q, portal, agent, status]);

  const filtersActive = portal !== ALL || agent !== ALL || status !== ALL || q !== "";

  function resetFilters() {
    setPortal(ALL);
    setAgent(ALL);
    setStatus(ALL);
    setQ("");
  }

  return (
    <div className="p-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead</h1>
          <p className="text-muted-foreground">Tutti i lead salvati nel sistema.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cerca lead…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </header>

      {error && <Card className="mb-4 border-destructive/40 bg-destructive/5"><CardContent className="p-4 text-sm text-destructive">{(error as Error).message}</CardContent></Card>}

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" /> Filtri
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1 block text-xs">Portale</Label>
              <Select value={portal} onValueChange={setPortal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tutti</SelectItem>
                  {portalOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Agente</Label>
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tutti gli agenti</SelectItem>
                  {(agents || []).map((a) => (
                    <SelectItem key={a.id || a.code} value={a.name}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Stato</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tutti</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={resetFilters}
                disabled={!filtersActive}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset filtri
              </Button>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            {isLoading ? "Caricamento…" : `${filtered.length} lead trovati`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Portale</th>
                  <th className="px-4 py-3">Immobile</th>
                  <th className="px-4 py-3">Agente</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Creato</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Caricamento…</td></tr>}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nessun lead trovato.</td></tr>
                )}
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/leads/$leadId" params={{ leadId: l.id }} className="text-primary hover:underline">
                        {l.name || "Senza nome"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{l.phone || "—"}</td>
                    <td className="px-4 py-3">{l.email || "—"}</td>
                    <td className="px-4 py-3">{l.source || "—"}</td>
                    <td className="px-4 py-3">{l.property_ref || "—"}</td>
                    <td className="px-4 py-3">{typeof l.agent === "string" ? l.agent : l.agent?.name || "—"}</td>
                    <td className="px-4 py-3"><Badge className={statusColor(l.status)} variant="secondary">{translateStatus(l.status)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{l.created_at ? new Date(l.created_at).toLocaleDateString("it-IT") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
