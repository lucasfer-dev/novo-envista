"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Draft = { savedAt: number; entries: [string, string][] };
/**
 * Preserves user-authored form values in this browser tab if a Server Action
 * redirects with an error or the network fails. No private data is sent to
 * analytics or stored outside the current tab.
 */
export default function ResilientServerForm({
  action, className, storageKey, clearOnSuccess = false, children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
  storageKey: string;
  clearOnSuccess?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      if (clearOnSuccess) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      const text = sessionStorage.getItem(storageKey);
      if (!text || !ref.current) return;
      const draft = JSON.parse(text) as Draft;
      if (!Array.isArray(draft.entries) || !draft.savedAt || Date.now() - draft.savedAt > 86_400_000) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      const values = new Map<string, string[]>();
      for (const [name, value] of draft.entries) {
        if (typeof name !== "string" || typeof value !== "string") continue;
        values.set(name, [...(values.get(name) ?? []), value]);
      }
      for (const el of Array.from(ref.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[name]"))) {
        if (el instanceof HTMLInputElement && el.type === "checkbox") {
          el.checked = values.get(el.name)?.includes(el.value) ?? false;
        } else {
          const value = values.get(el.name)?.[0];
          if (value !== undefined) el.value = value;
        }
      }
      setRestored(draft.entries.length > 0);
    } catch {
      // Draft persistence is optional: never prevent form submission.
    }
  }, [storageKey, clearOnSuccess]);

  function save() {
    try {
      if (!ref.current) return;
      const entries: [string, string][] = [];
      new FormData(ref.current).forEach((value, key) => {
        if (typeof value === "string") entries.push([key, value]);
      });
      sessionStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), entries }));
    } catch {
      // Storage disabled or full.
    }
  }

  return (
    <form ref={ref} className={className} action={action} onInput={save} onChange={save} onSubmit={save}>
      {restored && !clearOnSuccess ? <p role="status">Rascunho recuperado nesta aba. Você pode continuar de onde parou.</p> : null}
      {children}
    </form>
  );
}
