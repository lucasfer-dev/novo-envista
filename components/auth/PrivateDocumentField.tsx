"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { isValidCnpj, isValidCpf, normalizePrivateDocument } from "@/lib/auth/validation";
import { caretAfterDigits, formatCpfCnpj } from "@/lib/auth/format-cpf-cnpj";
import { IdCard } from "lucide-react";
import authStyles from "./Auth.module.css";
import styles from "./RegisterShell.module.css";

export function PrivateDocumentField() {
  const [displayValue, setDisplayValue] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);
  const digits = normalizePrivateDocument(displayValue);
  const complete = digits.length === 11 || digits.length === 14;
  const valid = digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false;
  const showError = (touched || complete) && digits.length > 0 && !valid;

  useLayoutEffect(() => {
    const next = caretDigits.current;
    if (next === null || !inputRef.current || document.activeElement !== inputRef.current) return;
    const position = caretAfterDigits(displayValue, next);
    inputRef.current.setSelectionRange(position, position);
    caretDigits.current = null;
  }, [displayValue]);

  return (
    <div className={styles.fieldWithIcon}>
      <label htmlFor="register-document">
        CPF ou CNPJ
        <input
          ref={inputRef}
          id="register-document"
          type="text"
          name="document"
          inputMode="numeric"
          autoComplete="off"
          maxLength={18}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          value={displayValue}
          aria-describedby="register-document-help register-document-error"
          aria-invalid={showError || undefined}
          onChange={(event) => {
            const raw = event.currentTarget.value;
            const caret = event.currentTarget.selectionStart ?? raw.length;
            caretDigits.current = raw.slice(0, caret).replace(/\D/g, "").length;
            setDisplayValue(formatCpfCnpj(raw));
          }}
          onBlur={() => { setTouched(true); caretDigits.current = null; }}
          required
        />
        <span id="register-document-help" className={authStyles.muted}>
          Os pontos e traços são preenchidos automaticamente. O documento é validado e armazenado de forma protegida.
        </span>
        <span id="register-document-error" className={showError ? authStyles.fieldError : authStyles.srOnly} aria-live="polite">
          {digits.length <= 11 ? "Informe um CPF válido." : "Informe um CNPJ válido."}
        </span>
      </label>
      <IdCard className={styles.fieldIcon} aria-hidden="true" />
    </div>
  );
}
