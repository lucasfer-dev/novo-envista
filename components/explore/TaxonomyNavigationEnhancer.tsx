"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const STAGES = new Set(["Ideia", "Validação", "Protótipo", "MVP", "Projeto ativo"]);

const SELECTOR = [
  ".profile-skills .chips span",
  ".project-hero .chips span",
  ".project-hero .stage",
  ".team-hero .chips span",
  ".project-card .chips span",
  ".project-card .stage",
].join(", ");

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

export default function TaxonomyNavigationEnhancer() {
  const pathname = usePathname() || "/app";
  const router = useRouter();

  useEffect(() => {
    const base = pathname.startsWith("/investor") ? "/investor" : "/app";

    const mark = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((element) => {
        const value = clean(element.textContent);
        if (!value) return;
        element.dataset.envistaTaxonomyLink = "true";
        element.setAttribute("role", "link");
        element.tabIndex = 0;
        element.setAttribute("aria-label", `Explorar ${value}`);
        element.title = `Explorar ${value}`;
      });
    };

    const destination = (element: HTMLElement) => {
      const value = clean(element.textContent);
      if (!value) return null;
      const params = new URLSearchParams();
      if (STAGES.has(value)) params.set("stage", value);
      else params.set("q", value);
      return `${base}/explore?${params.toString()}`;
    };

    const activate = (element: HTMLElement, event: Event) => {
      const href = destination(element);
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      router.push(href);
    };

    const isLegacyCompetitionsButton = (element: Element | null) => {
      const button = element?.closest<HTMLElement>(".app-shell button");
      if (!button) return null;
      return clean(button.textContent) === "Competições" ? button : null;
    };

    const onClick = (event: MouseEvent) => {
      const origin = event.target instanceof Element ? event.target : null;
      const competitionButton = isLegacyCompetitionsButton(origin);
      if (competitionButton) {
        event.preventDefault();
        event.stopPropagation();
        // Competições usa uma árvore de página server-rendered diferente do EnvistaApp legado.
        // Uma navegação completa evita que chunks/RSC de um deploy anterior sejam reaproveitados.
        window.location.assign(`${base}/competitions`);
        return;
      }

      const target = origin?.closest<HTMLElement>("[data-envista-taxonomy-link='true']") ?? null;
      if (target) activate(target, event);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-envista-taxonomy-link='true']")
        : null;
      if (target) activate(target, event);
    };

    mark();
    const observer = new MutationObserver(mark);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [pathname, router]);

  return (
    <style>{`
      [data-envista-taxonomy-link='true'] {
        cursor: pointer;
        transition: border-color .18s ease, background-color .18s ease, color .18s ease;
      }
      [data-envista-taxonomy-link='true']:hover {
        border-color: rgba(0, 191, 166, .42) !important;
        background: rgba(0, 191, 166, .10) !important;
        color: #8fe8dc !important;
      }
      [data-envista-taxonomy-link='true']:focus-visible {
        outline: 2px solid var(--green);
        outline-offset: 2px;
      }
    `}</style>
  );
}
