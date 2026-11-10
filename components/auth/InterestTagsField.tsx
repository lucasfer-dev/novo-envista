"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import styles from "@/app/onboarding/Onboarding.module.css";

export const MAX_INTEREST_TAGS = 12;

const SUGGESTED_TAGS = [
  "Tecnologia", "Programação", "Games", "IA", "Robótica", "Design",
  "Empreendedorismo", "Inovação", "Educação", "Impacto social", "Ciência",
  "Sustentabilidade", "Acessibilidade", "Negócios", "Saúde", "Audiovisual",
  "Marketing", "Cibersegurança", "Dados", "Meio ambiente", "Finanças",
  "Cultura", "Esportes", "Startups",
] as const;

function cleanTag(tag: string) {
  return tag.normalize("NFC").replace(/\s+/g, " ").replace(/[,;<>]/g, "").trim().slice(0, 48);
}

function deduplicate(tags: readonly string[]) {
  const names = new Set<string>();
  return tags.map(cleanTag).filter((tag) => {
    const key = tag.toLocaleLowerCase("pt-BR");
    if (!tag || names.has(key)) return false;
    names.add(key);
    return true;
  });
}

type InterestTagsFieldProps = {
  initialTags: string[];
  draftKey: string;
};

export function InterestTagsField({ initialTags, draftKey }: InterestTagsFieldProps) {
  const suggestions = SUGGESTED_TAGS as readonly string[];
  const originalCustom = initialTags.filter((tag) => !suggestions.some((name) => name.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR")));
  const [customTags, setCustomTags] = useState(() => deduplicate(originalCustom));
  const [selected, setSelected] = useState(() => deduplicate(initialTags.filter((tag) => suggestions.includes(tag))));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const allTags = deduplicate([...selected, ...customTags]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const data = parsed as { custom?: unknown; selected?: unknown };
          const custom = Array.isArray(data.custom) ? deduplicate(data.custom.filter((value): value is string => typeof value === "string")) : originalCustom;
          const checked = Array.isArray(data.selected) ? deduplicate(data.selected.filter((value): value is string => typeof value === "string")).filter((tag) => suggestions.includes(tag)) : selected;
          setSelected(checked.slice(0, MAX_INTEREST_TAGS));
          setCustomTags(custom.filter((tag) => !checked.some((name) => name.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR"))).slice(0, Math.max(0, MAX_INTEREST_TAGS - checked.length)));
        }
      }
    } catch {
      // The draft is optional and should never block onboarding.
    }
    setHydrated(true);
    // Restore only on mount; subsequent updates are saved below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ selected, custom: customTags }));
    } catch {
      // Local storage is best-effort; hidden form inputs still submit normally.
    }
  }, [draftKey, selected, customTags, hydrated]);

  function toggle(tag: string) {
    setError("");
    if (selected.includes(tag)) {
      setSelected((value) => value.filter((item) => item !== tag));
    } else if (allTags.length >= MAX_INTEREST_TAGS) {
      setError(`Você pode escolher até ${MAX_INTEREST_TAGS} interesses. Remova um para selecionar outro.`);
    } else {
      setSelected((value) => [...value, tag]);
    }
  }

  function addTag() {
    const tag = cleanTag(draft);
    if (!tag) { setError("Digite uma palavra ou assunto para adicionar."); return; }
    if (allTags.some((value) => value.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR"))) {
      setError("Você já adicionou esse interesse.");
      return;
    }
    if (allTags.length >= MAX_INTEREST_TAGS) {
      setError(`O limite é de ${MAX_INTEREST_TAGS} interesses. Remova um antes de adicionar outro.`);
      return;
    }
    setCustomTags((value) => [...value, tag]);
    setDraft("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <fieldset className={styles.interests} aria-describedby="interest-instructions interest-counter">
      <legend>Interesses e tags <span>(opcional)</span></legend>
      <p id="interest-instructions" className={styles.tagIntro}>Escolha os assuntos que combinam com você ou adicione os seus.</p>
      <div className={styles.tagOptions}>
        {suggestions.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              className={[styles.tagChip, active ? styles.tagChipActive : ""].join(" ")}
              onClick={() => toggle(tag)}
            >
              {active ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
              {tag}
            </button>
          );
        })}
      </div>
      <div className={styles.tagAddRow}>
        <div className={styles.tagInput}>
          <Plus size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={draft}
            maxLength={48}
            onChange={(event) => { setDraft(event.target.value); if (error) setError(""); }}
            onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); addTag(); }
            }}
            placeholder="Outra tag: ex. fotografia, saúde, astronomia..."
            aria-label="Nova tag personalizada"
            aria-describedby="interest-counter"
          />
        </div>
        <button type="button" className={styles.tagAddButton} onClick={addTag} disabled={allTags.length >= MAX_INTEREST_TAGS}>
          Adicionar
        </button>
      </div>
      {customTags.length ? (
        <div className={styles.customTags} aria-label="Tags adicionadas por você">
          {customTags.map((tag) => (
            <span className={styles.customTag} key={tag}>
              {tag}
              <button
                type="button"
                onClick={() => { setCustomTags((tags) => tags.filter((value) => value !== tag)); setError(""); }}
                aria-label={`Remover interesse ${tag}`}
              ><X size={13} aria-hidden="true" /></button>
            </span>
          ))}
        </div>
      ) : null}
      <p id="interest-counter" className={styles.tagCounter}>{allTags.length} de {MAX_INTEREST_TAGS} interesses selecionados</p>
      {error ? <p className={styles.tagError} role="status">{error}</p> : null}
      {/* Submit with the same names that the existing server action already validates. */}
      {selected.map((tag) => <input type="hidden" key={tag} name="interest_tags" value={tag} />)}
      <input type="hidden" name="interest_tags_other" value={customTags.join(",")} />
    </fieldset>
  );
}
