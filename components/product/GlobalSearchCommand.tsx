"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FolderKanban, Users, CircleUserRound, GraduationCap } from "lucide-react";
import styles from "./GlobalSearchCommand.module.css";

type SearchItem = {
  id: string;
  type: "project" | "team" | "profile" | "course";
  title: string;
  subtitle: string;
  href: string;
};

const icons = {
  project: FolderKanban,
  team: Users,
  profile: CircleUserRound,
  course: GraduationCap,
};

const typeLabel = {
  project: "Projeto",
  team: "Equipe",
  profile: "Perfil",
  course: "Curso",
};

export default function GlobalSearchCommand({
  label = "Buscar no Envista",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      window.setTimeout(() => inputRef.current?.focus(), 30);
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(items.length ? 0 : -1);
  }, [items]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("search-failed");
        const payload = (await response.json()) as { items?: SearchItem[] };
        setItems(payload.items ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setItems([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    router.push(href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (items.length) setActiveIndex((index) => (index + 1 + items.length) % items.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length) setActiveIndex((index) => (index - 1 + items.length) % items.length);
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      go(items[activeIndex].href);
    }
  };

  const trimmedQuery = query.trim();

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}. Atalho Control ou Command K`}
      >
        <Search size={17} aria-hidden="true" />
        <span>{label}</span>
        <kbd>Ctrl K</kbd>
      </button>
      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-search-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span id="global-search-title" className={styles.srOnly}>Busca global do Envista</span>
            <div className={styles.inputRow}>
              <Search size={19} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Projetos, equipes, pessoas ou cursos..."
                autoComplete="off"
                role="combobox"
                aria-expanded="true"
                aria-controls="global-search-results"
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `global-search-result-${activeIndex}` : undefined}
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar busca"><X size={18} /></button>
            </div>
            <div className={styles.results} id="global-search-results" role="listbox" aria-label="Resultados da busca">
              {trimmedQuery.length < 2 ? (
                <div className={styles.emptyState}>
                  <Search size={22} aria-hidden="true" />
                  <strong>Encontre qualquer coisa no Envista</strong>
                  <span>Digite pelo menos 2 caracteres para buscar projetos, equipes, pessoas e cursos.</span>
                </div>
              ) : null}
              {loading ? <p className={styles.hint} role="status" aria-live="polite">Buscando no Envista...</p> : null}
              {!loading && trimmedQuery.length >= 2 && !items.length ? (
                <div className={styles.emptyState} role="status" aria-live="polite">
                  <Search size={22} aria-hidden="true" />
                  <strong>Nenhum resultado para “{trimmedQuery}”</strong>
                  <span>Tente outro nome, tema ou palavra-chave.</span>
                </div>
              ) : null}
              {items.map((item, index) => {
                const Icon = icons[item.type];
                const active = index === activeIndex;
                return (
                  <button
                    id={`global-search-result-${index}`}
                    key={`${item.type}:${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`${styles.result} ${active ? styles.resultActive : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(item.href)}
                  >
                    <span className={styles.icon}><Icon size={18} aria-hidden="true" /></span>
                    <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                    <em>{typeLabel[item.type]}</em>
                  </button>
                );
              })}
            </div>
            <footer>
              <span><kbd>↑</kbd> <kbd>↓</kbd> navegar · <kbd>Enter</kbd> abrir</span>
              <span><kbd>Esc</kbd> fechar</span>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
