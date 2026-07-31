from __future__ import annotations

import json
import math
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "src" / "data" / "symptom-model.json"
METRICS_PATH = ROOT / "ml" / "reports" / "metrics.json"


def predict_top(selected: set[str]) -> str:
    artifact = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    features = artifact["features"]
    vector = [1.0 if feature in selected else 0.0 for feature in features]
    scores = []
    for coefficients, intercept in zip(
        artifact["coefficients"],
        artifact["intercepts"],
        strict=True,
    ):
        scores.append(
            intercept
            + sum(weight * value for weight, value in zip(coefficients, vector, strict=True))
        )
    maximum = max(scores)
    exponents = [math.exp(score - maximum) for score in scores]
    probabilities = [value / sum(exponents) for value in exponents]
    best_index = max(range(len(probabilities)), key=probabilities.__getitem__)
    return artifact["classes"][best_index]["key"]


class SymptomModelTests(unittest.TestCase):
    def test_artifacts_exist_and_are_labelled_synthetic(self) -> None:
        self.assertTrue(MODEL_PATH.exists())
        metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        self.assertEqual(metrics["datasetType"], "synthetic-demonstration")
        self.assertIn("not clinical", metrics["warning"].lower())

    def test_synthetic_holdout_threshold(self) -> None:
        metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        self.assertGreaterEqual(metrics["accuracy"], 0.80)
        self.assertGreaterEqual(metrics["macroF1"], 0.80)

    def test_respiratory_pattern(self) -> None:
        self.assertEqual(
            predict_top({"runny_nose", "sneezing", "cough", "sore_throat"}),
            "common_cold_pattern",
        )

    def test_airway_pattern(self) -> None:
        self.assertEqual(
            predict_top({"breathlessness", "wheezing", "chest_tightness", "cough"}),
            "asthma_pattern",
        )

    def test_urinary_pattern(self) -> None:
        self.assertEqual(
            predict_top({"burning_urination", "frequent_urination", "abdominal_pain"}),
            "urinary_pattern",
        )


if __name__ == "__main__":
    unittest.main()
