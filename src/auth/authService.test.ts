import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "./authService";

// Ensure unit tests never hit the live backend — authService falls back to
// its in-memory localStorage path when VITE_AUTH_API_URL is empty.
vi.stubEnv("VITE_AUTH_API_URL", "");

describe("CareBridge authentication gate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts without an authenticated session", () => {
    expect(authService.getSession()).toBeNull();
  });

  it("signs in a role-bound doctor demo account", async () => {
    await authService.registerEmail({
      displayName: "Dr. Ananya Kumar",
      email: "doctor@carebridge.demo",
      password: "Doctor@123",
      role: "doctor",
    });
    const session = await authService.loginEmail({
      email: "doctor@carebridge.demo",
      password: "Doctor@123",
      role: "doctor",
    });
    expect(session.user.role).toBe("doctor");
    expect(authService.getSession()?.user.role).toBe("doctor");
  });

  it("does not allow the doctor credential to enter operations", async () => {
    await authService.registerEmail({
      displayName: "Dr. Ananya Kumar",
      email: "doctor@carebridge.demo",
      password: "Doctor@123",
      role: "doctor",
    });
    await expect(
      authService.loginEmail({
        email: "doctor@carebridge.demo",
        password: "Doctor@123",
        role: "operations",
      }),
    ).rejects.toThrow();
  });

  it("creates public registrations with selected workspace role", async () => {
    const session = await authService.registerEmail({
      displayName: "Demo Patient",
      email: `new.patient.${Date.now()}@example.test`,
      password: "Secure123",
      role: "patient",
    });
    expect(session.user.role).toBe("patient");
    expect(session.user.provider).toBe("email");
  });

  it("removes the session on sign out", async () => {
    await authService.registerEmail({
      displayName: "Demo Patient",
      email: "patient@carebridge.demo",
      password: "Patient@123",
      role: "patient",
    });
    await authService.loginEmail({
      email: "patient@carebridge.demo",
      password: "Patient@123",
      role: "patient",
    });
    authService.signOut();
    expect(authService.getSession()).toBeNull();
  });
});
