// Central API service layer. All backend interactions go through here.
// Backend: Python FastAPI. Configure base URL via localStorage key "crm_api_base"
// or VITE_API_BASE env at build time. No business logic here — pure transport.

const DEFAULT_BASE = "http://localhost:8000";

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("crm_api_base");
    if (stored) return stored.replace(/\/+$/, "");
  }
  const env = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  return (env || DEFAULT_BASE).replace(/\/+$/, "");
}

export function setApiBase(url: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("crm_api_base", url);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Types ----------
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  property_ref?: string;
  message?: string;
  agent?: Agent | string;
  source?: string;
  status?: string;
  template?: string;
  whatsapp_message?: string;
  whatsapp_sent_at?: string;
  created_at?: string;
  history?: LeadHistoryItem[];
}

export interface LeadHistoryItem {
  timestamp: string;
  action: string;
  detail?: string;
}

export interface Agent {
  id?: string;
  code: string;
  name: string;
  phone: string;
}

export interface Stats {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  pending_leads: number;
  per_source: { source: string; count: number }[];
  per_agent: { agent: string; count: number }[];
  recent_activity: { timestamp: string; type: string; detail: string }[];
}

export interface ScanResult {
  leads: Lead[];
}

// ---------- Endpoints ----------
export const api = {
  scan: (mode: "manual" | "automatic" = "manual") =>
    request<ScanResult>("/scan", { method: "POST", body: JSON.stringify({ mode }) }),
  listLeads: () => request<Lead[]>("/leads"),
  getLead: (id: string) => request<Lead>(`/leads/${id}`),
  updateLead: (id: string, data: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  stats: () => request<Stats>("/stats"),
  sendWhatsapp: (payload: { lead_id: string; template?: string; message?: string }) =>
    request<{ ok: boolean; sent_at: string }>("/whatsapp/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listAgents: () => request<Agent[]>("/agents"),
  saveAgent: (agent: Agent) =>
    request<Agent>("/agents", { method: "POST", body: JSON.stringify(agent) }),
};
