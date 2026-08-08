import type { Role } from "../types";

export type AuthProvider = "email" | "google" | "facebook" | "whatsapp";

export interface AuthUser {
  id: string;
  displayName: string;
  role: Role;
  provider: AuthProvider;
  email?: string;
  phone?: string;
  verified: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
  issuedAt: number;
}

export interface EmailRegistrationInput {
  displayName: string;
  email: string;
  password: string;
  role?: Role;
}

export interface EmailLoginInput {
  email: string;
  password: string;
  role: Role;
}
