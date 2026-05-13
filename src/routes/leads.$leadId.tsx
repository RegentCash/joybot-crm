import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, FileText, User, Send, Clock } from "lucide-react";
import { translateStatus } from "@/lib/i18n";

export const Route = createFileRoute("/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Dettaglio lead — EstateCRM" },
      { name: "description", content: "Cronologia completa del lead." },
    ],
  }),
  component: () => (
    <AppLayout>
      <LeadDetail />
    </AppLayout>
  ),
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => api.getLead(leadId),
  });

  return (
    <div className="p-8">
      <Link to="/leads" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Torna ai lead
      </Link>

      {isLoading && <p className="text-muted-foreground">Caricamento…</p>}
      {error && <Card className="border-destructive/40 bg-destructive/5"><CardContent className="p-4 text-sm text-destructive">{(error as Error).message}</CardContent></Card>}

      {lead && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{lead.name || "Lead senza nome"}</span>
                  <Badge variant="secondary">{translateStatus(lead.status)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <Field icon={Phone} label="Telefono" value={lead.phone} />
                <Field icon={Mail} label="Email" value={lead.email} />
                <Field icon={FileText} label="Rif. immobile" value={lead.property_ref} />
                <Field icon={User} label="Agente" value={typeof lead.agent === "string" ? lead.agent : lead.agent?.name} />
                <Field icon={FileText} label="Portale" value={lead.source} />
                <Field icon={Clock} label="Creato il" value={lead.created_at ? new Date(lead.created_at).toLocaleString("it-IT") : undefined} />
                <div className="sm:col-span-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Messaggio originale</div>
                  <div className="mt-1 rounded-md border bg-muted/40 p-3 whitespace-pre-wrap">{lead.message || "—"}</div>
                </div>
              </CardContent>
            </Card>

            {lead.whatsapp_message && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Send className="h-4 w-4" /> WhatsApp inviato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-3 text-muted-foreground">
                    <span>Template: <strong className="text-foreground">{lead.template || "—"}</strong></span>
                    {lead.whatsapp_sent_at && <span>Inviato: <strong className="text-foreground">{new Date(lead.whatsapp_sent_at).toLocaleString("it-IT")}</strong></span>}
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap">{lead.whatsapp_message}</div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle>Cronologia</CardTitle></CardHeader>
            <CardContent>
              {(!lead.history || lead.history.length === 0) ? (
                <p className="text-sm text-muted-foreground">Nessuna cronologia disponibile.</p>
              ) : (
                <ol className="relative space-y-4 border-l pl-4">
                  {lead.history.map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="text-sm font-medium">{h.action}</div>
                      {h.detail && <div className="text-xs text-muted-foreground">{h.detail}</div>}
                      <div className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString("it-IT")}</div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}
