"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import styles from "./Auth.module.css";

export function RegisterPasswordFields({ minLength }: { minLength: number }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const longEnough = password.length >= minLength;
  const matches = useMemo(
    () => confirmation.length > 0 && password === confirmation,
    [confirmation, password],
  );

  return (
    <>
      <div className={styles.grid2}>
        <label>
          Senha
          <div className={styles.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              minLength={minLength}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className={styles.passwordToggle}
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </label>

        <label>
          Confirmar senha
          <div className={styles.passwordWrap}>
            <input
              type={showConfirmation ? "text" : "password"}
              name="password_confirmation"
              autoComplete="new-password"
              minLength={minLength}
              maxLength={128}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
            <button
              className={styles.passwordToggle}
              type="button"
              aria-label={showConfirmation ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
              aria-pressed={showConfirmation}
              onClick={() => setShowConfirmation((current) => !current)}
            >
              {showConfirmation ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </label>
      </div>

      <div className={styles.passwordRules} aria-live="polite">
        <span className={longEnough ? styles.ruleOk : undefined}>
          <Check size={14} aria-hidden="true" />
          Pelo menos {minLength} caracteres
        </span>
        <span className={matches ? styles.ruleOk : undefined}>
          <Check size={14} aria-hidden="true" />
          As senhas coincidem
        </span>
      </div>
    </>
  );
}
