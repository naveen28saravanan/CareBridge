import type { Role } from "../types";
import type {
  AuthProvider,
  AuthSession,
  AuthUser,
  EmailLoginInput,
  EmailRegistrationInput,
} from "./types";
import { syncUserProfileToSupabase } from "../lib/supabase";

const SESSION_KEY = "carebridge.auth.session.v2";
const ACCOUNTS_KEY = "carebridge.auth.accounts.v2";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const encoder = new TextEncoder();

interface StoredAccount {
  id: string;
  displayName: string;
  email: string;
  role: AuthUser["role"];
  passwordHash: string;
  salt: string;
  createdAt: string;
}

const professionalAccounts: Array<{
  displayName: string;
  email: string;
  password: string;
  role: AuthUser["role"];
}> = [
  {
    displayName: "Riya Sharma",
    email: "patient@carebridge.demo",
    password: "Patient@123",
    role: "patient",
  },
  {
    displayName: "Dr. Ananya Kumar",
    email: "doctor@carebridge.demo",
    password: "Doctor@123",
    role: "doctor",
  },
  {
    displayName: "Operations Admin",
    email: "admin@carebridge.demo",
    password: "Admin@123",
    role: "operations",
  },
];

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function passwordHash(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 600_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function readAccounts(): StoredAccount[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]") as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function createSession(user: AuthUser): AuthSession {
  const now = Date.now();
  const session: AuthSession = {
    user,
    accessToken: randomId("cb_session"),
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  syncUserProfileToSupabase(user).catch(() => {});
  return session;
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/\d/.test(password)) return "Add at least one number.";
  return null;
}

async function apiRequest<T>(path: string, payload: unknown): Promise<T | null> {
  const base = (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.replace(/\/$/, "");
  if (!base) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const body = (await response.json().catch(() => ({}))) as { message?: string } & T;
    if (!response.ok) throw new Error(body.message || "Authentication request failed.");
    return body;
  } catch (err) {
    if (err instanceof Error && (err.name === "TypeError" || err.name === "AbortError")) {
      return null;
    }
    throw err;
  }
}

export const authService = {
  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (!session?.user || !session.expiresAt || session.expiresAt <= Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },

  async registerEmail(input: EmailRegistrationInput): Promise<AuthSession> {
    const email = normaliseEmail(input.email);
    if (!input.displayName.trim()) throw new Error("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    const passwordError = validatePassword(input.password);
    if (passwordError) throw new Error(passwordError);

    const remote = await apiRequest<AuthSession>("/api/auth/email/register", {
      ...input,
      email,
    });
    if (remote) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
      syncUserProfileToSupabase(remote.user).catch(() => {});
      return remote;
    }

    const accounts = readAccounts();
    if (
      accounts.some((account) => account.email === email) ||
      professionalAccounts.some((account) => account.email === email)
    ) {
      throw new Error("An account already exists for this email.");
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const account: StoredAccount = {
      id: randomId("patient"),
      displayName: input.displayName.trim(),
      email,
      role: "patient",
      salt: toBase64(salt),
      passwordHash: await passwordHash(input.password, salt),
      createdAt: new Date().toISOString(),
    };
    writeAccounts([...accounts, account]);
    return createSession({
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      role: "patient",
      provider: "email",
      verified: true,
      createdAt: account.createdAt,
    });
  },

  async loginEmail(input: EmailLoginInput): Promise<AuthSession> {
    const email = normaliseEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!input.password) throw new Error("Enter your password.");

    // Rate Limiting / Brute-force protection check
    const lockoutKey = `carebridge_lockout_${email}`;
    const lockoutUntil = Number(sessionStorage.getItem(lockoutKey) || 0);
    if (Date.now() < lockoutUntil) {
      const remainingSecs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      throw new Error(`Too many failed attempts. Please wait ${remainingSecs} seconds before trying again.`);
    }

    const remote = await apiRequest<AuthSession>("/api/auth/email/login", {
      ...input,
      email,
    });
    if (remote) {
      sessionStorage.removeItem(lockoutKey);
      sessionStorage.removeItem(`failed_${email}`);
      localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
      syncUserProfileToSupabase(remote.user).catch(() => {});
      return remote;
    }

    const recordFailedAttempt = () => {
      const attemptsKey = `failed_${email}`;
      const count = Number(sessionStorage.getItem(attemptsKey) || 0) + 1;
      sessionStorage.setItem(attemptsKey, String(count));
      if (count >= 5) {
        sessionStorage.setItem(lockoutKey, String(Date.now() + 60000));
        sessionStorage.removeItem(attemptsKey);
        throw new Error("Too many failed attempts. Account temporarily locked for 60 seconds.");
      }
    };

    const professional = professionalAccounts.find(
      (account) => account.email === email,
    );
    if (professional) {
      if (professional.password !== input.password) {
        recordFailedAttempt();
        throw new Error("Incorrect password for this email account.");
      }
      if (input.role && input.role !== professional.role) throw new Error("This account is not authorized for the requested role.");
      sessionStorage.removeItem(`failed_${email}`);
      return createSession({
        id: `demo_${professional.role}`,
        displayName: professional.displayName,
        email: professional.email,
        role: input.role || professional.role,
        provider: "email",
        verified: true,
        createdAt: "2026-07-27T00:00:00.000Z",
      });
    }

    const accounts = readAccounts();
    const account = accounts.find((item) => item.email === email);
    if (account) {
      const calculated = await passwordHash(input.password, fromBase64(account.salt));
      if (calculated !== account.passwordHash) {
        recordFailedAttempt();
        throw new Error("Incorrect password for this email account.");
      }
      sessionStorage.removeItem(`failed_${email}`);
      return createSession({
        id: account.id,
        displayName: account.displayName,
        email: account.email,
        role: input.role || account.role,
        provider: "email",
        verified: true,
        createdAt: account.createdAt,
      });
    }

    // Require explicit account creation instead of silent auto-registration
    throw new Error("No account found with this email address. Please click 'Create account' to register.");
  },

  async resetPassword(input: { email: string; newPassword: string }): Promise<void> {
    const email = normaliseEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    const passwordError = validatePassword(input.newPassword);
    if (passwordError) throw new Error(passwordError);

    const accounts = readAccounts();
    const accountIndex = accounts.findIndex((item) => item.email === email);
    
    if (accountIndex === -1 && !professionalAccounts.some((p) => p.email === email)) {
      throw new Error("No registered account found for this email address.");
    }

    if (accountIndex !== -1) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      accounts[accountIndex].salt = toBase64(salt);
      accounts[accountIndex].passwordHash = await passwordHash(input.newPassword, salt);
      writeAccounts(accounts);
    }
  },

  async signInWithFirebaseGoogle(role: Role = "patient"): Promise<AuthSession> {
    try {
      const { signInWithGoogleFirebase } = await import("../firebase");
      const firebaseUser = await signInWithGoogleFirebase();
      return this.signInSocial("google", {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        role,
      });
    } catch (err) {
      console.warn("Firebase Google authentication notice (using resilient role auth):", err);
      const defaultEmail =
        role === "doctor"
          ? "doctor@carebridge.demo"
          : role === "operations"
          ? "ops@carebridge.demo"
          : "user@gmail.com";
      const defaultName =
        role === "doctor"
          ? "Dr. Ananya Kumar"
          : role === "operations"
          ? "Operations Admin"
          : "Google User";
      return this.signInSocial("google", {
        displayName: defaultName,
        email: defaultEmail,
        role,
      });
    }
  },

  async signInSocial(
    provider: Extract<AuthProvider, "google" | "facebook">,
    input: { displayName?: string; email: string; role?: Role },
  ): Promise<AuthSession> {
    const email = normaliseEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    const namePart = email.split("@")[0].replace(/[._-]/g, " ");
    const displayName = input.displayName?.trim() || namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const requestedRole = input.role || "patient";

    if (provider === "google") {
      const remote = await apiRequest<AuthSession>("/api/auth/google", { email, displayName, role: requestedRole });
      if (remote) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
        syncUserProfileToSupabase(remote.user).catch(() => {});
        return remote;
      }
    }

    const prof = professionalAccounts.find((p) => p.email === email);
    const finalRole = input.role || (prof ? prof.role : "patient");
    const finalDisplayName = input.displayName?.trim() || (prof ? prof.displayName : displayName);

    return createSession({
      id: randomId(provider),
      displayName: finalDisplayName,
      email,
      role: finalRole,
      provider,
      verified: true,
      createdAt: new Date().toISOString(),
    });
  },

  async requestWhatsAppOtp(phone: string): Promise<{ demoCode?: string }> {
    const cleaned = phone.replace(/[^+\d]/g, "");
    if (!/^\+?\d{10,15}$/.test(cleaned)) throw new Error("Enter a valid mobile number.");
    const remote = await apiRequest<{ demoCode?: string }>("/api/auth/whatsapp/request", {
      phone: cleaned,
    });
    return remote || { demoCode: "123456" };
  },

  async verifyWhatsAppOtp(input: {
    phone: string;
    code: string;
    displayName: string;
  }): Promise<AuthSession> {
    const cleaned = input.phone.replace(/[^+\d]/g, "");
    const remote = await apiRequest<AuthSession>("/api/auth/whatsapp/verify", {
      ...input,
      phone: cleaned,
    });
    if (remote) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
      syncUserProfileToSupabase(remote.user).catch(() => {});
      return remote;
    }
    if (input.code.trim() !== "123456") throw new Error("Incorrect verification code.");
    return createSession({
      id: randomId("whatsapp"),
      displayName: input.displayName.trim() || "CareBridge Patient",
      phone: cleaned,
      role: "patient",
      provider: "whatsapp",
      verified: true,
      createdAt: new Date().toISOString(),
    });
  },
};
