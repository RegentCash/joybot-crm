import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type Lead } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, Phone, FileText, User, MessageSquare, Send, SkipForward, CheckCircle2, ScanSearch, Bot, Hand } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/extractor")({
  head: () => ({
    meta: [
      { title: "Estrazione — EstateCRM" },
      { name: "description", content: "Scansiona email, rivedi i lead estratti, invia messaggi WhatsApp." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Extractor />
    </AppLayout>
  ),
});

const TEMPLATES = ["initial_contact", "viewing_request", "price_inquiry", "follow_up", "rental_inquiry"];

function Extractor() {
  const [mode, setMode] = useState<"manual" | "automatic">("manual");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [index, setIndex] = useState(0);
  const [editedTemplate, setEditedTemplate] = useState<string>("");
  const [editedMessage, setEditedMessage] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const scanMutation = useMutation({
    mutationFn: () => api.scan(mode),
    onSuccess: (res) => {
      setLeads(res.leads || []);
      setIndex(0);
      if (res.leads?.[0]) {
        setEditedTemplate(res.leads[0].template || "");
        setEditedMessage(res.leads[0].whatsapp_message || "");
      }
      pushLog(`Scansione completata: ${res.leads?.length ?? 0} lead`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMutation = useMutation({
    mutationFn: (lead: Lead) =>
      api.sendWhatsapp({ lead_id: lead.id, template: editedTemplate, message: editedMessage }),
    onSuccess: (_d, lead) => {
      pushLog(`WhatsApp inviato → ${lead.name}`);
      toast.success(`WhatsApp inviato a ${lead.name}`);
      next();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markContacted = useMutation({
    mutationFn: (lead: Lead) => api.updateLead(lead.id, { status: "contacted" }),
    onSuccess: (_d, lead) => {
      pushLog(`Segnato come gestito → ${lead.name}`);
      next();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function pushLog(line: string) {
    setLogs((l) => [`${new Date().toLocaleTimeString("it-IT")} — ${line}`, ...l].slice(0, 100));
  }

  function next() {
    const ni = index + 1;
    if (ni >= leads.length) {
      toast.success("Tutti i lead sono stati elaborati");
      setLeads([]);
      setIndex(0);
      return;
    }
    setIndex(ni);
    const l = leads[ni];
    setEditedTemplate(l.template || "");
    setEditedMessage(l.whatsapp_message || "");
  }

  const current = leads[index];
  const total = leads.length;
  const progress = total ? ((index) / total) * 100 : 0;

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estrazione</h1>
          <p className="text-muted-foreground">Scansiona le email in arrivo e rivedi i lead uno per uno.</p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList>
            <TabsTrigger value="manual" className="gap-2"><Hand className="h-4 w-4" /> Manuale</TabsTrigger>
            <TabsTrigger value="automatic" className="gap-2"><Bot className="h-4 w-4" /> Automatico</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium">
              {mode === "manual" ? "Modalità manuale" : "Modalità automatica"}
            </div>
            <p className="text-sm text-muted-foreground">
              {mode === "manual"
                ? "Rivedrai ogni lead e sceglierai se inviare WhatsApp, ignorare o segnare come gestito."
                : "Il backend elabora le scansioni e invia i messaggi WhatsApp senza intervento."}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
          >
            {scanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
            Scansiona ora
          </Button>
        </CardContent>
      </Card>

      {mode === "automatic" && (
        <Card>
          <CardHeader><CardTitle>Registro attività</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">In attesa dei risultati della scansione…</p>
            ) : (
              <ul className="max-h-96 space-y-1 overflow-auto font-mono text-xs">
                {logs.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {mode === "manual" && current && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-2" />
            <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
              Lead {index + 1} di {total}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{current.name || "Lead sconosciuto"}</span>
                  <Badge variant="secondary">{current.source || "email"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Field icon={Phone} label="Telefono" value={current.phone} />
                <Field icon={Mail} label="Email" value={current.email} />
                <Field icon={FileText} label="Rif. immobile" value={current.property_ref} />
                <Field icon={User} label="Agente" value={typeof current.agent === "string" ? current.agent : current.agent?.name} />
                <div>
                  <div className="mb-1 flex items-center gap-2 text-muted-foreground"><MessageSquare className="h-4 w-4" /> Messaggio del cliente</div>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                    {current.message || "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anteprima WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Template rilevato dall'AI</Label>
                  <Select value={editedTemplate} onValueChange={setEditedTemplate}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleziona template" /></SelectTrigger>
                    <SelectContent>
                      {[...new Set([editedTemplate, ...TEMPLATES].filter(Boolean))].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Messaggio</Label>
                  <Textarea
                    className="mt-1 min-h-[180px] font-mono text-sm"
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => sendMutation.mutate(current)} disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Invia WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => markContacted.mutate(current)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Segna come gestito
                  </Button>
                  <Button variant="ghost" onClick={() => { pushLog(`Ignorato → ${current.name}`); next(); }}>
                    <SkipForward className="mr-2 h-4 w-4" /> Ignora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {mode === "manual" && !current && !scanMutation.isPending && (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Nessun lead in coda. Clicca <strong>Scansiona ora</strong> per recuperare nuovi lead.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}
