import { describe, expect, it } from "vitest";
import {
  createSafeLocalReply,
  detectSymptoms,
  isEmergencyMessage,
} from "./chat";

describe("patient chat safety engine", () => {
  it("intercepts emergency language before general guidance", () => {
    const result = createSafeLocalReply(
      "I have severe chest pain and cannot breathe",
    );
    expect(isEmergencyMessage("I have severe chest pain")).toBe(true);
    expect(result.urgency).toBe("emergency");
    expect(result.actions.some((action) => action.id === "call112")).toBe(true);
    expect(result.text).toContain("112");
  });

  it("does not give medication dose changes", () => {
    const result = createSafeLocalReply("Should I double my tablet dose?");
    expect(result.text).toContain(
      "cannot start, stop, replace, or change a dose",
    );
    expect(result.actions.some((action) => action.id === "consult")).toBe(true);
  });

  it("extracts English, Tamil and Hindi symptom terms", () => {
    expect(detectSymptoms("fever and cough")).toEqual(
      expect.arrayContaining(["fever", "cough"]),
    );
    expect(detectSymptoms("காய்ச்சல் மற்றும் இருமல்")).toEqual(
      expect.arrayContaining(["fever", "cough"]),
    );
    expect(detectSymptoms("बुखार और खांसी")).toEqual(
      expect.arrayContaining(["fever", "cough"]),
    );
  });

  it("routes symptom descriptions through the local prediction model", () => {
    const result = createSafeLocalReply(
      "I have fever, cough and body ache",
    );
    expect(result.detectedSymptoms.length).toBeGreaterThanOrEqual(3);
    expect(result.text).toContain("not a diagnosis");
    expect(result.actions.some((action) => action.id === "symptoms")).toBe(
      true,
    );
  });
});
