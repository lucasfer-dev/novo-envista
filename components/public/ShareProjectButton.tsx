"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type ShareProjectButtonProps = {
  title: string;
  href: string;
  className?: string;
};

export default function ShareProjectButton({ title, href, className }: ShareProjectButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = href.startsWith("http") ? href : `${window.location.origin}${href}`;
    const shareData = {
      title: `${title} | Envista`,
      text: `Conheça o projeto ${title} no Envista.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } catch {
        // O link continua disponível na página mesmo se o navegador bloquear o clipboard.
      }
    }
  }

  return (
    <button type="button" className={className} onClick={handleShare} aria-live="polite">
      {copied ? <Check size={15} aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
      {copied ? "Link copiado" : "Compartilhar projeto"}
    </button>
  );
}
