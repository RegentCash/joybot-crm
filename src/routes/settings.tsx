import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { getApiBase, setApiBase } from "@/lib/api";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Impostazioni — EstateCRM" },
      { name: "description", content: "Configura la connessione al backend." },
    ],
  }),
  component: () => (
    <AppLayout>
      <SettingsPage />
    </AppLayout>
  ),
});

function SettingsPage() {
  const [url, setUrl] = useState("");
  useEffect(() => { setUrl(getApiBase()); }, []);

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground">Configura la connessione al tuo backend Python FastAPI.</p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>API Backend</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL di base</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com" />
            <p className="mt-1 text-xs text-muted-foreground">
              Il frontend comunica con questo URL per tutte le chiamate REST (<code>/scan</code>, <code>/leads</code>, <code>/stats</code>, <code>/whatsapp/send</code>, <code>/agents</code>).
            </p>
          </div>
          <Button onClick={() => { setApiBase(url.trim()); toast.success("URL API salvato"); }}>
            <Save className="mr-2 h-4 w-4" /> Salva
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
