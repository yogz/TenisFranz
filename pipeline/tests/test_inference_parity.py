"""Inference parity test — Python side.

Generates a fixture of random feature vectors scored against the committed
`web/public/data/model.json` and asserts anti-symmetry at 1e-12.

The same fixture is consumed by `web/lib/predict.parity.test.ts` which
asserts bit-for-bit agreement between Python and TypeScript at 1e-9.

Running this test has a side effect: it writes
`pipeline/tests/fixtures/inference_parity.json`, which is committed so the
TS test can consume it without needing a Python runtime.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import pytest

from tenisfranz import inference
from tenisfranz.config import REPO_ROOT

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "inference_parity.json"
MODEL_PATH = REPO_ROOT / "web" / "public" / "data" / "model.json"


def _random_features(rng: random.Random) -> inference.PlayerFeatures:
    return inference.PlayerFeatures(
        elo_surface=rng.uniform(1400, 2200),
        serve_pct=rng.uniform(0.55, 0.75),
        return_pct=rng.uniform(0.30, 0.50),
        form=rng.uniform(0.3, 0.8),
        h2h=rng.uniform(0.2, 0.8),
        fatigue=rng.uniform(0.0, 0.8),
        age=rng.uniform(18, 38),
    )


@pytest.fixture(scope="module")
def models() -> list[inference.TrainedModelView]:
    if not MODEL_PATH.exists():
        pytest.skip(f"{MODEL_PATH} not found — run the pipeline once first")
    bundle = json.loads(MODEL_PATH.read_text())
    return [inference.TrainedModelView.from_json(m) for m in bundle["models"]]


def _feats_to_dict(f: inference.PlayerFeatures) -> dict:
    return {
        "eloSurface": f.elo_surface,
        "servePct": f.serve_pct,
        "returnPct": f.return_pct,
        "form": f.form,
        "h2h": f.h2h,
        "fatigue": f.fatigue,
        "age": f.age,
    }


def test_anti_symmetry(models):
    rng = random.Random(17)
    for _ in range(200):
        fa = _random_features(rng)
        fb = _random_features(rng)
        for model in models:
            assert inference.anti_symmetric(model, fa, fb, tourney_weight=2.0)


def test_generate_fixture(models):
    """Produce a stable fixture consumed by the TS parity test."""
    rng = random.Random(42)
    cases = []
    for i in range(120):
        fa = _random_features(rng)
        fb = _random_features(rng)
        tw = rng.choice([1.0, 2.0, 3.0, 4.0])
        model = models[i % len(models)]
        prob_a = inference.apply_model(model, fa, fb, tw)
        cases.append({
            "modelIndex": i % len(models),
            "tour": model.tour,
            "surface": model.surface,
            "featuresA": _feats_to_dict(fa),
            "featuresB": _feats_to_dict(fb),
            "tourneyWeight": tw,
            "probA": prob_a,
        })

    FIXTURE_PATH.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE_PATH.write_text(json.dumps({"cases": cases}, indent=2))
    assert FIXTURE_PATH.exists()
    assert len(cases) == 120
