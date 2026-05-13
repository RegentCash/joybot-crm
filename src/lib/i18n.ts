// Italian translations for status values coming from backend.
// API field names stay in English; only display strings translate.

export function translateStatus(status?: string): string {
  switch ((status || "new").toLowerCase()) {
    case "new": return "Nuovo";
    case "contacted": return "Gestito";
    case "ignored": return "Ignorato";
    case "pending": return "In attesa";
    default: return status || "Nuovo";
  }
}

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "Nuovo" },
  { value: "contacted", label: "Gestito" },
  { value: "ignored", label: "Ignorato" },
  { value: "pending", label: "In attesa" },
];
