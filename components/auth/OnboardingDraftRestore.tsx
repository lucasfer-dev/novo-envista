"use client";

import { useEffect } from "react";

type DraftValue =
  | { kind: "value"; value: string }
  | { kind: "checkbox"; checked: boolean };

const EXCLUDED_NAMES = new Set(["terms", "privacy"]);

function fieldKey(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  if (element instanceof HTMLInputElement && element.type === "checkbox" && element.name === "interest_tags") {
    return `${element.name}:${element.value}`;
  }
  return element.name;
}

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
      for (const element of Array.from(form.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
        if (!element.name || EXCLUDED_NAMES.has(element.name) || element.type === "hidden" || element.type === "password") continue;

        const saved = draft[fieldKey(element)];
        if (!saved) continue;

        if (element instanceof HTMLInputElement && element.type === "checkbox") {
          if (saved.kind === "checkbox") {
            element.checked = saved.checked;
            element.dispatchEvent(new Event("change", { bubbles: true }));
          }
          continue;
        }

        if (saved.kind === "value" && !element.disabled) setNativeValue(element, saved.value);
      }
    };

    restore();
    const timer = window.setTimeout(restore, 250);

    const save = () => {
      const next: Record<string, DraftValue> = {};

      for (const element of Array.from(form.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
        if (!element.name || EXCLUDED_NAMES.has(element.name) || element.type === "hidden" || element.type === "password") continue;

        const key = fieldKey(element);
        if (element instanceof HTMLInputElement && element.type === "checkbox") {
          next[key] = { kind: "checkbox", checked: element.checked };
        } else {
          next[key] = { kind: "value", value: element.value };
        }
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Draft persistence is best-effort only.
      }
    };

    form.addEventListener("input", save);
    form.addEventListener("change", save);

    return () => {
      window.clearTimeout(timer);
      form.removeEventListener("input", save);
      form.removeEventListener("change", save);
    };
  }, [formId, storageKey]);

  return null;
}
