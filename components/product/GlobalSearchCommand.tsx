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
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (open) window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

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
    router.push(href);
  };

  return (
    <>
      <button className={styles.trigger} type="button" onClick={() => setOpen(true)} aria-label={`${label}. Atalho Control K`}>
        <Search size={17} aria-hidden="true" />
        <span>{label}</span>
        <kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-label="Busca global" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.inputRow}>
              <Search size={19} aria-hidden="true" />
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Projetos, equipes, pessoas ou cursos..." autoComplete="off" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar busca"><X size={18} /></button>
            </div>
            <div className={styles.results}>
              {query.trim().length < 2 ? <p className={styles.hint}>Digite pelo menos 2 caracteres. Use ↑ ↓ e Enter no futuro; por enquanto, clique no resultado.</p> : null}
              {loading ? <p className={styles.hint}>Buscando...</p> : null}
              {!loading && query.trim().length >= 2 && !items.length ? <p className={styles.hint}>Nenhum resultado encontrado.</p> : null}
              {items.map((item) => {
                const Icon = icons[item.type];
                return (
                  <button key={`${item.type}:${item.id}`} type="button" className={styles.result} onClick={() => go(item.href)}>
                    <span className={styles.icon}><Icon size={18} /></span>
                    <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                    <em>{item.type === "project" ? "Projeto" : item.type === "team" ? "Equipe" : item.type === "course" ? "Curso" : "Perfil"}</em>
                  </button>
                );
              })}
            </div>
            <footer><span>Busca global do Envista</span><span>ESC para fechar</span></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
