import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Agent } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus, Save, UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agenti — EstateCRM" },
      { name: "description", content: "Gestisci gli agenti immobiliari." },
    ],
  }),
  component: () => (
    <AppLayout>
      <AgentsPage />
    </AppLayout>
  ),
});

function emptyAgent(): Agent { return { code: "", name: "", phone: "" }; }

function AgentsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["agents"], queryFn: () => api.listAgents() });
  const [draft, setDraft] = useState<Agent>(emptyAgent());

  const save = useMutation({
    mutationFn: (a: Agent) => api.saveAgent(a),
    onSuccess: () => {
      toast.success("Agente salvato");
      setDraft(emptyAgent());
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Agenti</h1>
        <p className="text-muted-foreground">Crea o aggiorna gli agenti che gestiscono i lead.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="h-4 w-4" /> Elenco agenti</CardTitle></CardHeader>
          <CardContent className="p-0">
            {error && <div className="p-4 text-sm text-destructive">{(error as Error).message}</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Codice</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Telefono</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Caricamento…</td></tr>}
                  {!isLoading && (!data || data.length === 0) && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nessun agente presente.</td></tr>
                  )}
                  {data?.map((a) => (
                    <tr key={a.id || a.code} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-mono">{a.code}</td>
                      <td className="px-4 py-3 font-medium">{a.name}</td>
                      <td className="px-4 py-3">{a.phone}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDraft(a)}>Modifica</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> {draft.id ? "Modifica agente" : "Nuovo agente"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Codice</Label>
              <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="A001" />
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Maria Rossi" />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+39 333 000 0000" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.code || !draft.name}>
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salva
              </Button>
              {draft.id && <Button variant="ghost" onClick={() => setDraft(emptyAgent())}>Annulla</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
