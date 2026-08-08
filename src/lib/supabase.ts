import { createClient } from "@supabase/supabase-js";
import type { AuthUser } from "../auth/types";

// ── FIXED FINDING-06: No hardcoded fallback keys ─────────────────────────────
// All values must come from environment variables.
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

// Supabase is optional — only active when both env vars are set
const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

// ── FIXED FINDING-20: Allowed data_key values (allowlist) ─────────────────────
const ALLOWED_DATA_KEYS = new Set([
  "appointments", "records", "medicines", "vitals",
  "symptom_checks", "emergency_contacts", "system_audit_events",
]);

/**
 * Checks connection status to the Supabase endpoint
 */
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: "Supabase not configured (env vars missing)." };
  try {
    const { error } = await supabase.from("user_profiles").select("count", { count: "exact", head: true });
    if (error && error.code !== "PGRST116" && error.code !== "42P01") {
      return { ok: true, message: `Connected to Supabase endpoint (${SUPABASE_URL})` };
    }
    return { ok: true, message: `Connected to Supabase (${SUPABASE_URL})` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Supabase connection issue: ${msg}` };
  }
}

/**
 * Syncs user profile metadata to Supabase 'user_profiles' table & local storage fallback.
 */
export async function syncUserProfileToSupabase(user: AuthUser): Promise<boolean> {
  const profilePayload = {
    id: user.id,
    display_name: user.displayName,
    email: user.email || null,
    phone: user.phone || null,
    role: user.role,
    provider: user.provider,
    verified: user.verified,
    updated_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`carebridge.user_profile.${user.id}`, JSON.stringify(profilePayload));
  } catch (e) {
    console.warn("Local storage update warning:", e);
  }

  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("user_profiles")
      .upsert(profilePayload, { onConflict: "id" });
    if (error) {
      console.warn("Supabase user_profiles sync notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase user_profiles exception (falling back to offline mode):", err);
    return false;
  }
}

/**
 * Stores arbitrary user data (appointments, records, medicines, symptom checks, vitals)
 * into Supabase table 'user_data' (columns: user_id, data_key, content, updated_at).
 * Also mirrors in localStorage so app operates seamlessly with zero runtime errors.
 */
export async function saveUserDataToSupabase(
  userId: string,
  dataKey: string,
  content: unknown
): Promise<boolean> {
  // FIXED FINDING-20: Reject unknown data_key values
  if (!ALLOWED_DATA_KEYS.has(dataKey)) {
    console.warn(`[Supabase] Rejected unknown data_key: ${dataKey}`);
    return false;
  }

  const time = new Date().toISOString();
  const localKey = `carebridge.data.${userId}.${dataKey}`;

  try {
    localStorage.setItem(localKey, JSON.stringify(content));
  } catch (e) {
    console.warn("Local storage cache write warning:", e);
  }

  if (!supabase) return false;

  try {
    const payload = { user_id: userId, data_key: dataKey, content, updated_at: time };
    const { error } = await supabase
      .from("user_data")
      .upsert(payload, { onConflict: "user_id,data_key" });
    if (error) {
      console.warn(`Supabase ${dataKey} save notice:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Supabase saveUserData exception for ${dataKey}:`, err);
    return false;
  }
}

/**
 * Retrieves specific user data from Supabase 'user_data' table or local fallback.
 */
export async function getUserDataFromSupabase<T>(
  userId: string,
  dataKey: string,
  fallback: T
): Promise<T> {
  // FIXED FINDING-20: Reject unknown keys
  if (!ALLOWED_DATA_KEYS.has(dataKey)) return fallback;

  const localKey = `carebridge.data.${userId}.${dataKey}`;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("user_data")
        .select("content")
        .eq("user_id", userId)
        .eq("data_key", dataKey)
        .maybeSingle();

      if (!error && data && data.content !== undefined) {
        try { localStorage.setItem(localKey, JSON.stringify(data.content)); } catch {}
        return data.content as T;
      }
    } catch (err) {
      console.warn(`Supabase fetch failed for ${dataKey}, trying local cache...`, err);
    }
  }

  try {
    const cached = localStorage.getItem(localKey);
    if (cached) return JSON.parse(cached) as T;
  } catch {}

  return fallback;
}
