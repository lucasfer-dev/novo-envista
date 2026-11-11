"""Testes sem dependências externas do ajustador de playbooks."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import optimize_alethe

FIXTURE = """version: 1
profile: savings
providers: [claude, codex, agy]
playbooks:
  complete:
    phases:
      - id: plan
        tier: strong
      - id: quick
        tier: strong
      - id: read
        workers: 4
      - id: build
        tier: standard
        provider: auto
        rules:
          - if: [deep, claude-opus-above:50]
            use: { model: sonnet, effort: high }
      - id: review
        tier: standard
        provider: codex
        readOnly: true
        gate: Checks pass
  scout-then-build:
    phases:
      - id: brief
        tier: strong
      - id: scout
        workers: 4
      - id: plan
        tier: strong
      - id: build
        tier: standard
  plan-execute:
    phases:
      - id: execute
        tier: standard
  plan-big-execute-small:
    phases:
      - id: investigate
        workers: 4
  parallel-worktrees:
    phases:
      - id: build
        tier: standard
        workers: 3
"""
SCRIPT = Path(optimize_alethe.__file__)


class OptimizeAletheTests(unittest.TestCase):
    def test_balanced_routes_risk_review_and_idempotence(self):
        output = optimize_alethe.optimize(FIXTURE)
        self.assertEqual(output.count("\n        tier: standard"), 9)
        self.assertEqual(output.count("workers: 2"), 4)
        self.assertEqual(output.count("provider: codex"), 5)
        self.assertIn("use: { provider: claude, tier: standard }", output)
        self.assertIn("use: { provider: claude, model: sonnet, effort: high }", output)
        self.assertIn("providers: [claude, codex, agy]", output)
        self.assertIn("profile: savings", output)
        self.assertEqual(optimize_alethe.optimize(output), output)

    def test_respects_custom_providers(self):
        customized = FIXTURE.replace("provider: auto", "provider: claude")
        with self.assertRaises(ValueError):
            optimize_alethe.optimize(customized)

    def test_unknown_schema_does_not_modify_source(self):
        unknown = FIXTURE.replace("workers: 4", "workers: 7", 1)
        with self.assertRaises(ValueError):
            optimize_alethe.optimize(unknown)

    def test_failed_doctor_rolls_back_to_identical_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            cfg = directory / "alethe-playbooks.yaml"
            cfg.write_text(FIXTURE, encoding="utf-8")
            doctor = directory / "doctor.py"
            doctor.write_text('import json\nprint(json.dumps({"playbooks":{"valid":False,"error":"forced"},"policy":{"valid":True}}))\n', encoding="utf-8")
            result = subprocess.run([sys.executable, str(SCRIPT), "--apply", "--path", str(cfg), "--doctor", str(doctor)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(cfg.read_bytes(), FIXTURE.encode("utf-8"))
            self.assertEqual(len(list(directory.glob("*.backup-*"))), 1)

    def test_valid_doctor_applies(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            cfg = directory / "alethe-playbooks.yaml"
            cfg.write_text(FIXTURE, encoding="utf-8")
            doctor = directory / "doctor.py"
            doctor.write_text('import json\nprint(json.dumps({"playbooks":{"valid":True},"policy":{"valid":True}}))\n', encoding="utf-8")
            result = subprocess.run([sys.executable, str(SCRIPT), "--apply", "--path", str(cfg), "--doctor", str(doctor)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(cfg.read_text(encoding="utf-8"), optimize_alethe.optimize(FIXTURE))


if __name__ == "__main__":
    unittest.main()
