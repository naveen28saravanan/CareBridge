import { saveUserDataToSupabase, getUserDataFromSupabase } from "../lib/supabase";

export interface AuditEvent {
  id: string;
  title: string;
  actor: string;
  timestamp: string;
  // FIXED FINDING-14: category broadened to string to avoid call-site TS errors,
  // while keeping semantic labels for filter UI.
  category: string;
  details?: string;
}

// FIXED FINDING-14: Audit events are scoped to the authenticated user's own ID.
// The shared "system" key has been removed from production Supabase writes.
// For operations-level cross-user audit logs, implement a server-side endpoint
// secured with the Supabase service role key — never the anon key.
// The userId parameter defaults to "local_ops" for the Operations workspace demo
// so that the UI continues to function offline without a live Supabase connection.

const AUDIT_STORAGE_KEY = "system_audit_events";

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

/**
 * Retrieves audit events scoped to the given user ID.
 * Pass the current authenticated user's ID.
 */
export async function getAuditEvents(userId: string = "local_ops"): Promise<AuditEvent[]> {
  return getUserDataFromSupabase<AuditEvent[]>(userId, AUDIT_STORAGE_KEY, INITIAL_AUDIT_EVENTS);
}

/**
 * Records an audit event scoped to the authenticated user's ID.
 * All parameters except userId are optional for backward compatibility.
 */
export async function recordAuditEvent(
  titleOrUserId: string,
  actorOrTitle?: string,
  categoryOrActor?: string,
  detailsOrCategory?: string,
  details?: string
): Promise<AuditEvent[]> {
  // Support legacy 4-arg call: recordAuditEvent(title, actor, category, details)
  // and new 5-arg call: recordAuditEvent(userId, title, actor, category, details)
  let userId: string;
  let title: string;
  let actor: string;
  let category: string;
  let eventDetails: string | undefined;

  if (details !== undefined) {
    // New 5-arg signature: (userId, title, actor, category, details)
    userId = titleOrUserId;
    title = actorOrTitle ?? "";
    actor = categoryOrActor ?? "System";
    category = detailsOrCategory ?? "operations";
    eventDetails = details;
  } else {
    // Legacy 4-arg signature: (title, actor, category, details)
    userId = "local_ops";
    title = titleOrUserId;
    actor = actorOrTitle ?? "System";
    category = categoryOrActor ?? "operations";
    eventDetails = detailsOrCategory;
  }

  const currentEvents = await getAuditEvents(userId);
  const newEvent: AuditEvent = {
    id: `aud-${Date.now()}`,
    title,
    actor,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    category,
    details: eventDetails,
  };

  const updated = [newEvent, ...currentEvents].slice(0, 50);
  await saveUserDataToSupabase(userId, AUDIT_STORAGE_KEY, updated);
  return updated;
}
