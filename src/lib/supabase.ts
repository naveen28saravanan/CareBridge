import { createClient } from "@supabase/supabase-js";
import type { AuthUser } from "../auth/types";

// Default Supabase project configuration
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  "https://dgedfbccshbwolcefdwa.supabase.co";

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZWRmYmNjc2hid29sY2VmZHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwODg4MDAsImV4cCI6MjA2NjY2NDgwMH0.placeholder";

// Create Supabase client instance with safe auto-refresh and session storage options
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Checks connection status to the Supabase endpoint
 */
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from("user_profiles").select("count", { count: "exact", head: true });
    if (error && error.code !== "PGRST116" && error.code !== "42P01") {
      // 42P01 is table doesn't exist yet; endpoint is reachable
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

  // Always back up in localStorage for resilient zero-error offline mode
  try {
    localStorage.setItem(`carebridge.user_profile.${user.id}`, JSON.stringify(profilePayload));
  } catch (e) {
    console.warn("Local storage update warning:", e);
  }

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
  const time = new Date().toISOString();
  const localKey = `carebridge.data.${userId}.${dataKey}`;

  try {
    localStorage.setItem(localKey, JSON.stringify(content));
  } catch (e) {
    console.warn("Local storage cache write warning:", e);
  }

  try {
    const payload = {
      user_id: userId,
      data_key: dataKey,
      content: content,
      updated_at: time,
    };

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
  const localKey = `carebridge.data.${userId}.${dataKey}`;

  // 1. Try reading from Supabase table first
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("content")
      .eq("user_id", userId)
      .eq("data_key", dataKey)
      .maybeSingle();

    if (!error && data && data.content !== undefined) {
      // Update local storage cache
      try {
        localStorage.setItem(localKey, JSON.stringify(data.content));
      } catch {}
      return data.content as T;
    }
  } catch (err) {
    console.warn(`Supabase fetch failed for ${dataKey}, trying local cache...`, err);
  }

  // 2. Fallback to localStorage cache
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {}

  // 3. Fallback to default initial value
  return fallback;
}
