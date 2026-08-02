import { saveUserDataToSupabase, getUserDataFromSupabase } from "../lib/supabase";

export interface AuditEvent {
  id: string;
  title: string;
  actor: string;
  timestamp: string;
  category: "auth" | "clinical" | "operations" | "patient";
  details?: string;
}

const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "aud-1",
    title: "Role permission verified",
    actor: "Operations System",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    category: "operations",
    details: "Role bound session initialized",
  },
  {
    id: "aud-2",
    title: "Doctor profile verified",
    actor: "Verifier 02",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    category: "operations",
    details: "TNMC registration validated",
  },
  {
    id: "aud-3",
    title: "Hospital status updated",
    actor: "Facility Reporter",
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    category: "operations",
    details: "ICU bed capacity updated",
  },
];

const AUDIT_STORAGE_KEY = "system_audit_events";

export async function getAuditEvents(): Promise<AuditEvent[]> {
  return getUserDataFromSupabase<AuditEvent[]>("system", AUDIT_STORAGE_KEY, INITIAL_AUDIT_EVENTS);
}

export async function recordAuditEvent(
  title: string,
  actor: string,
  category: AuditEvent["category"],
  details?: string
): Promise<AuditEvent[]> {
  const currentEvents = await getAuditEvents();
  const newEvent: AuditEvent = {
    id: `aud-${Date.now()}`,
    title,
    actor,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    category,
    details,
  };

  const updated = [newEvent, ...currentEvents].slice(0, 50); // Keep last 50 events
  await saveUserDataToSupabase("system", AUDIT_STORAGE_KEY, updated);
  return updated;
}
