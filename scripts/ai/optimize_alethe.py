#!/usr/bin/env python3
"""Balanceia playbooks locais do Alethe sem trocar modelos, contas ou permissões.

Por padrão, apenas mostra diff. --apply cria backup e valida com doctor.
"""
import argparse
import difflib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from datetime import datetime

# Formato dos blocos é o da skill Alethe v24. Falhar fechado se ele mudar.
CHANGES = (
    ("complete", "plan", "tier", "strong", "standard"),
    ("complete", "quick", "tier", "strong", "standard"),
    ("complete", "read", "workers", "4", "2"),
    ("scout-then-build", "brief", "tier", "strong", "standard"),
    ("scout-then-build", "scout", "workers", "4", "2"),
    ("scout-then-build", "plan", "tier", "strong", "standard"),
    ("plan-big-execute-small", "investigate", "workers", "4", "2"),
    ("parallel-worktrees", "build", "workers", "3", "2"),
)


def subsection(text, heading_re, boundary_re, name):
    found = list(re.finditer(heading_re, text, re.M))
    if len(found) != 1:
        raise ValueError(f"Esperado exatamente um bloco {name}; encontrados {len(found)}")
    start = found[0].end()
    boundary = re.search(boundary_re, text[start:], re.M)
    end = start + boundary.start() if boundary else len(text)
    return start, end


# Implementadores padrão: Codex para código; Gemini para pesquisa e cascata mecânica.
# UI/UX: o lead pode selecionar Claude, com revisão visual em vez de rotear cegamente.
IMPLEMENTATION_ROUTES = (
    ("complete", "build"),
    ("scout-then-build", "build"),
    ("plan-execute", "execute"),
    ("parallel-worktrees", "build"),
)


def phase_bounds(text, book, phase):
    start, _ = subsection(text, r"^playbooks:[ \t]*$", r"^[A-Za-z][A-Za-z0-9_-]*:[ \t]*$", "playbooks")
    body = text[start:]
    a, b = subsection(body, rf"^  {re.escape(book)}:[ \t]*$", r"^  [a-z0-9-]+:[ \t]*$", book)
    book_text = body[a:b]
    x, y = subsection(book_text, rf"^      - id: {re.escape(phase)}[ \t]*$", r"^      - id: [a-z0-9-]+[ \t]*$", f"{book}/{phase}")
    return start + a + x, start + a + y


def set_implementation_provider(text, book, phase):
    x, y = phase_bounds(text, book, phase)
    part = text[x:y]
    providers = list(re.finditer(r"^        provider:\s*(\w+)[ \t]*$", part, re.M))
    if len(providers) > 1:
        raise ValueError(f"Provider duplicado em {book}/{phase}")
    if providers:
        current = providers[0].group(1)
        if current not in ("auto", "codex"):
            raise ValueError(f"{book}/{phase} ja tem provider: {current}; preservar escolha existente")
        part = part[:providers[0].start(1)] + "codex" + part[providers[0].end(1):]
    else:
        match = re.search(r"^        tier:\s*(?:cheap|standard|strong)[ \t]*$", part, re.M)
        if not match:
            raise ValueError(f"{book}/{phase} sem tier conhecido")
        part = part[:match.end()] + "\n        provider: codex" + part[match.end():]
    return text[:x] + part + text[y:]


def set_risk_review(text):
    x, y = phase_bounds(text, "complete", "review")
    part = text[x:y]
    rule = "        rules:\n          - if: risky\n            use: { provider: claude, tier: standard }\n"
    if rule in part:
        return text
    if re.search(r"^        rules:[ \t]*$", part, re.M):
        raise ValueError("Complete/review ja tem rules personalizadas; nao sobrescrever")
    if not re.search(r"^        provider:\s*codex[ \t]*$", part, re.M):
        raise ValueError("Complete/review nao usa Codex como reviewer normal")
    # Acrescentar ao fim da fase, preservando as condicoes e o gate.
    part = part.rstrip("\n") + "\n" + rule
    return text[:x] + part + text[y:]


def optimize(original):
    if not re.search(r"^playbooks:[ \t]*$", original, re.M):
        raise ValueError("O arquivo nao parece ser um playbook do Alethe")
    updated = original
    for book, phase, key, old, new in CHANGES:
        books_start, _ = subsection(updated, r"^playbooks:[ \t]*$", r"^[A-Za-z][A-Za-z0-9_-]*:[ \t]*$", "playbooks")
        head = updated[:books_start]
        body = updated[books_start:]
        a, b = subsection(body, rf"^  {re.escape(book)}:[ \t]*$", r"^  [a-z0-9-]+:[ \t]*$", book)
        book_text = body[a:b]
        x, y = subsection(book_text, rf"^      - id: {re.escape(phase)}[ \t]*$", r"^      - id: [a-z0-9-]+[ \t]*$", f"{book}/{phase}")
        phase_text = book_text[x:y]
        line_re = rf"^(        {re.escape(key)}:\s*)({re.escape(old)}|{re.escape(new)})(\s*(?:#.*)?)$"
        hits = list(re.finditer(line_re, phase_text, re.M))
        if len(hits) != 1:
            raise ValueError(f"Campo inesperado em {book}/{phase}/{key}; sem alteracao")
        if hits[0].group(2) == old:
            phase_text = phase_text[:hits[0].start(2)] + new + phase_text[hits[0].end(2):]
        book_text = book_text[:x] + phase_text + book_text[y:]
        body = body[:a] + book_text + body[b:]
        updated = head + body
    for book, phase in IMPLEMENTATION_ROUTES:
        updated = set_implementation_provider(updated, book, phase)
    # Complete/build tem uma excecao de escalonamento que escolhe Sonnet.
    # Se o provider da fase e Codex, essa regra precisa fixar Claude explicitamente.
    x, y = phase_bounds(updated, "complete", "build")
    part = updated[x:y]
    old = "use: { model: sonnet, effort: high }"
    new = "use: { provider: claude, model: sonnet, effort: high }"
    if part.count(old) == 1:
        part = part.replace(old, new)
    elif part.count(new) != 1:
        raise ValueError("Regra deep/Sonnet desconhecida; preservando playbook")
    updated = updated[:x] + part + updated[y:]
    updated = set_risk_review(updated)
    return updated


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="faz backup, grava e valida com o Alethe doctor")
    parser.add_argument("--path", type=Path, help="arquivo local para validação (ou fixture em testes)")
    parser.add_argument("--doctor", type=Path, help="caminho alternativo para scripts/orchestrate.py")
    args = parser.parse_args()
    appdata = os.getenv("APPDATA")
    if not appdata and not args.path:
        parser.error("APPDATA nao encontrado; use --path para testes")
    config = args.path or Path(appdata) / "Alethe" / "alethe-playbooks.yaml"
    if not config.is_file():
        parser.error(f"Configuracao nao encontrada: {config}. Rode /alethe setup primeiro.")
    original = config.read_text(encoding="utf-8-sig")
    try:
        updated = optimize(original)
    except ValueError as exc:
        parser.error(str(exc))
    diff = "".join(difflib.unified_diff(original.splitlines(True), updated.splitlines(True), fromfile=str(config), tofile="otimizado", n=2))
    if not diff:
        print("OK: configuracao ja possui os ajustes de eficiencia e economia; nada a fazer.")
        return 0
    print(diff)
    if not args.apply:
        print("PREVIA APENAS. Use --apply para salvar com backup e validar no seu PC.")
        return 0

    doctor = args.doctor or (Path(__file__).resolve().parents[2] / ".agents" / "skills" / "alethe" / "scripts" / "orchestrate.py")
    if not doctor.is_file():
        parser.error(f"Alethe doctor nao encontrado: {doctor}. Nada foi alterado.")
    backup = config.with_name(config.name + ".backup-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f"))
    shutil.copy2(config, backup)
    try:
        temp = config.with_name(config.name + ".tmp")
        temp.write_text(updated, encoding="utf-8")
        temp.replace(config)
        policy = config.with_name("alethe-orchestrate.json")
        args_doctor = [sys.executable, str(doctor), "doctor"]
        if policy.is_file():
            args_doctor += ["--policy", str(policy)]
        result = subprocess.run(args_doctor, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
        if result.returncode != 0:
            raise RuntimeError(f"doctor retornou {result.returncode}: {result.stderr[-1500:]}")
        data = json.loads(result.stdout)
        if data.get("playbooks", {}).get("valid") is not True:
            raise RuntimeError("playbooks.invalid: " + str(data.get("playbooks", {}).get("error")))
        if data.get("policy", {}).get("valid") is not True:
            raise RuntimeError("policy invalida: " + str(data.get("policy", {}).get("error")))
        print("VALIDADO: Alethe doctor confirmou playbooks.valid e policy.valid.")
        print("Backup:", backup)
        print("Arquivo ativo:", config)
        return 0
    except Exception as exc:
        shutil.copy2(backup, config)
        print(f"FALHA: {exc}. Configuracao anterior restaurada: {backup}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
