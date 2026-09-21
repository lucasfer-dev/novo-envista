"use client";

import { useEffect } from "react";

type DraftValue =
  | { kind: "value"; value: string }
  | { kind: "checkbox"; checked: boolean };

const EXCLUDED_NAMES = new Set(["terms", "privacy"]);

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function OnboardingDraftRestore({
  formId,
  storageKey,
}: {
  formId: string;
  storageKey: string;
}) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    let draft: Record<string, DraftValue> = {};
    try {
      draft = JSON.parse(localStorage.getItem(storageKey) || "{}") as Record<string, DraftValue>;
    } catch {
      draft = {};
    }

    const restore = () => {
      for (const [name, saved] of Object.entries(draft)) {
        if (EXCLUDED_NAMES.has(name)) continue;
        const fields = Array.from(form.elements.namedItem(name) instanceof RadioNodeList
          ? (form.elements.namedItem(name) as RadioNodeList)
          : [form.elements.namedItem(name)]).filter(Boolean) as Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

        for (const field of fields) {
          if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
            if (saved.kind === "checkbox" && field.type === "checkbox") {
              field.checked = saved.checked;
              field.dispatchEvent(new Event("change", { bubbles: true }));
            }
            continue;
          }

          if (saved.kind === "value" && !field.disabled) setNativeValue(field, saved.value);
        }
      }
    };

    restore();
    const timer = window.setTimeout(restore, 250);

    const save = () => {
      const next: Record<string, DraftValue> = {};
      const data = new FormData(form);

      for (const element of Array.from(form.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
        if (!element.name || EXCLUDED_NAMES.has(element.name) || element.type === "hidden" || element.type === "password") continue;

        if (element instanceof HTMLInputElement && element.type === "checkbox") {
          if (element.name === "interest_tags") {
            next[`${element.name}:${element.value}`] = { kind: "checkbox", checked: element.checked };
          } else {
            next[element.name] = { kind: "checkbox", checked: element.checked };
          }
          continue;
        }

        const value = data.get(element.name);
        if (typeof value === "string") next[element.name] = { kind: "value", value };
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Draft persistence is best-effort only.
      }
    };

    const onInput = () => save();
    const onChange = () => save();
    form.addEventListener("input", onInput);
    form.addEventListener("change", onChange);

    return () => {
      window.clearTimeout(timer);
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onChange);
    };
  }, [formId, storageKey]);

  return null;
}
