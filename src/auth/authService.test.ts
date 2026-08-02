import { beforeEach, describe, expect, it } from "vitest";
import { authService } from "./authService";

describe("CareBridge authentication gate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts without an authenticated session", () => {
    expect(authService.getSession()).toBeNull();
  });

  it("signs in a role-bound doctor demo account", async () => {
    const session = await authService.loginEmail({
      email: "doctor@carebridge.demo",
      password: "Doctor@123",
      role: "doctor",
    });
    expect(session.user.role).toBe("doctor");
    expect(authService.getSession()?.user.role).toBe("doctor");
  });

  it("does not allow the doctor credential to enter operations", async () => {
    await expect(
      authService.loginEmail({
        email: "doctor@carebridge.demo",
        password: "Doctor@123",
        role: "operations",
      }),
    ).rejects.toThrow();
  });

  it("creates public registrations as patient accounts", async () => {
    const session = await authService.registerEmail({
      displayName: "Demo Patient",
      email: `new.patient.${Date.now()}@example.test`,
      password: "Secure123",
    });
    expect(session.user.role).toBe("patient");
    expect(session.user.provider).toBe("email");
  });

  it("removes the session on sign out", async () => {
    await authService.loginEmail({
      email: "patient@carebridge.demo",
      password: "Patient@123",
      role: "patient",
    });
    authService.signOut();
    expect(authService.getSession()).toBeNull();
  });
});
