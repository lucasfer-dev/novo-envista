"use client";

import { useMemo, useState } from "react";
import styles from "./Auth.module.css";

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isCompleteValidBirthDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return false;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const earliest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
  return date <= today && date >= earliest;
}

export function BirthDateField() {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const complete = value.length === 10;
  const valid = useMemo(() => !complete || isCompleteValidBirthDate(value), [complete, value]);
  const showError = touched && complete && !valid;

  return (
    <label>
      Data de nascimento
      <input
        type="text"
        name="birth_date"
        inputMode="numeric"
        autoComplete="bday"
        placeholder="DD/MM/AAAA"
        value={value}
        maxLength={10}
        pattern="\d{2}/\d{2}/\d{4}"
        aria-describedby="birth-date-help birth-date-error"
        aria-invalid={showError || undefined}
        onChange={(event) => setValue(formatBirthDate(event.target.value))}
        onBlur={() => setTouched(true)}
        required
      />
      <span id="birth-date-help" className={styles.muted}>
        Digite no formato DD/MM/AAAA.
      </span>
      <span id="birth-date-error" className={showError ? styles.fieldError : styles.srOnly} aria-live="polite">
        Informe uma data válida no formato DD/MM/AAAA.
      </span>
    </label>
  );
}
