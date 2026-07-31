import { describe, expect, it } from "vitest";
import { predictSymptoms } from "./predict";

describe("local symptom insights", () => {
  it("routes emergency red flags before pattern ranking", () => {
    const result = predictSymptoms(["chest_pain", "fainting"]);
    expect(result.urgency).toBe("emergency");
    expect(result.redFlags).toHaveLength(2);
  });

  it("ranks an airway pattern and recommends prompt care", () => {
    const result = predictSymptoms([
      "breathlessness",
      "wheezing",
      "chest_tightness",
      "cough",
    ]);
    expect(result.candidates[0].key).toBe("asthma_pattern");
    expect(result.urgency).toBe("urgent");
  });

  it("retains the synthetic-data disclaimer", () => {
    const result = predictSymptoms(["runny_nose", "sneezing"]);
    expect(result.modelDatasetType).toBe("synthetic-demonstration");
    expect(result.disclaimer.toLowerCase()).toContain("not a diagnosis");
  });
});
