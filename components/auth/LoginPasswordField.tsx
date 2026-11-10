"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import styles from "./LoginPage.module.css";

export default function LoginPasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor="login-password">Senha</label>
        <Link className={styles.inlineLink} href="/forgot-password">Esqueci minha senha</Link>
      </div>
      <div className={styles.inputWrap}>
        <LockKeyhole className={styles.leadingIcon} aria-hidden="true" />
        <input
          id="login-password"
          type={visible ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          maxLength={128}
          required
        />
        <button
          type="button"
          className={styles.passwordButton}
          onClick={() => setVisible(value => !value)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          aria-controls="login-password"
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
