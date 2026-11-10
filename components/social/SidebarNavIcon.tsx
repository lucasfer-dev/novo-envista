"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  href: string;
  active: boolean;
  OutlineIcon: LucideIcon;
  size?: number;
};

/** Outline when idle, purpose-drawn solid silhouette when selected. */
function filledGlyph(href: string): ReactNode {
  const name = href === "/investor" ? "home" : href.split("/").filter(Boolean).at(-1);

  switch (name) {
    case "home":
      return (
        <path d="M12 2.5a1.6 1.6 0 0 0-1.07.42L2.7 10.1a1.2 1.2 0 0 0 1.58 1.8L5 11.3v8.05c0 1.18.96 2.15 2.15 2.15h3.2v-6.05h3.3v6.05h3.2c1.19 0 2.15-.97 2.15-2.15V11.3l.72.6a1.2 1.2 0 0 0 1.58-1.8l-8.23-7.18A1.6 1.6 0 0 0 12 2.5Z" />
      );
    case "explore":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m16.7 7.3-2.45 7.05-6.95 2.35 2.35-6.95 7.05-2.45Zm-5.5 5.5 2.25-.76.76-2.25-2.25.76-.76 2.25Z" fill="var(--envista-icon-knockout,#07242b)" fillRule="evenodd" />
        </>
      );
    case "notifications":
    case "activity":
      return (
        <>
          <path d="M12 2.5a6.3 6.3 0 0 0-6.3 6.3v3.6c0 1.4-.5 2.7-1.45 3.72l-1.02 1.1a1.2 1.2 0 0 0 .9 2.03h15.74a1.2 1.2 0 0 0 .9-2.03l-1.02-1.1a5.45 5.45 0 0 1-1.45-3.72V8.8A6.3 6.3 0 0 0 12 2.5Z" />
          <path d="M9.2 20.15a2.9 2.9 0 0 0 5.6 0Z" />
        </>
      );
    case "social":
      return <path d="M1.5 10.75h4.15l2.92-7.3a1 1 0 0 1 1.88.12l3.13 11.77 2.14-4.72a1 1 0 0 1 .91-.59h5.87v2.6h-5.1l-3.19 7.06a1 1 0 0 1-1.88-.14L9.26 8.1l-1.51 3.78a1 1 0 0 1-.93.63H1.5Z" />;
    case "messages":
      return <path d="M12 2.5c-5.4 0-9.7 3.77-9.7 8.65 0 2.5 1.2 4.7 3.16 6.27l-1.2 3.74a.75.75 0 0 0 1.02.93l4.05-1.85c.86.25 1.75.36 2.67.36 5.4 0 9.7-3.76 9.7-8.65S17.4 2.5 12 2.5Z" />;
    case "projects":
      return (
        <>
          <path d="M3.3 5.1a2.4 2.4 0 0 1 2.4-2.4h4.05l1.9 2.15h6.65a2.4 2.4 0 0 1 2.4 2.4v11.65a2.4 2.4 0 0 1-2.4 2.4H5.7a2.4 2.4 0 0 1-2.4-2.4Z" />
          <path d="M8.15 10.2h2.05v6.2H8.15Zm5.65 0h2.05v6.2H13.8Z" fill="var(--envista-icon-knockout,#07242b)" />
        </>
      );
    case "teams":
      return (
        <>
          <circle cx="9" cy="8" r="3.6" />
          <circle cx="17.35" cy="9" r="2.6" />
          <path d="M1.8 18.4c0-3.4 2.9-5.9 7.2-5.9 4.35 0 7.2 2.5 7.2 5.9v1.55a1.55 1.55 0 0 1-1.55 1.55H3.35a1.55 1.55 0 0 1-1.55-1.55Z" />
          <path d="M17 14.1c3.25.15 5.2 2.15 5.2 4.55v1.15a1.35 1.35 0 0 1-1.35 1.35h-3.05c.37-.6.55-1.26.55-1.97v-1.4c0-1.36-.48-2.62-1.35-3.68Z" />
        </>
      );
    case "competitions":
      return (
        <>
          <path d="M6 3h12v4.2a7.3 7.3 0 0 1-5 6.94V17h3.1v2.2h2.15V22H5.75v-2.8H8V17h3v-2.86A7.3 7.3 0 0 1 6 7.2Z" />
          <path d="M5.8 5H2v3.2c0 3.3 2 5.5 5.13 5.65L8 11.65C5.44 11.6 4.3 10.1 4.3 8.2v-.9H6Zm12.4 0H22v3.2c0 3.3-2 5.5-5.13 5.65L16 11.65c2.56-.05 3.7-1.55 3.7-3.45v-.9H18Z" />
        </>
      );
    case "learn":
      return (
        <>
          <path d="M12 2.8 1.2 8.65a1.25 1.25 0 0 0 0 2.2l10.8 5.86 10.8-5.86a1.25 1.25 0 0 0 0-2.2Z" />
          <path d="M5.25 14.1v4.25c1.92 2.03 4.12 3.03 6.75 3.03s4.83-1 6.75-3.03V14.1L12 17.75Z" />
          <path d="M21.5 11.1v6.35a1.1 1.1 0 1 1-2.2 0v-5.15Z" />
        </>
      );
    case "interests":
      return (
        <>
          <rect x="2.2" y="6.2" width="19.6" height="15" rx="2.5" />
          <path d="M8 6.5v-2A2 2 0 0 1 10 2.5h4a2 2 0 0 1 2 2v2Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M2.3 11.2h19.4v2.2H2.3Z" fill="var(--envista-icon-knockout,#07242b)" />
        </>
      );
    case "saved":
      return <path d="M6 2.5h12a2 2 0 0 1 2 2V21a1.2 1.2 0 0 1-1.83 1.02L12 18.2l-6.17 3.82A1.2 1.2 0 0 1 4 21V4.5a2 2 0 0 1 2-2Z" />;
    case "following":
      return (
        <>
          <path d="M1.5 12S5.55 5.7 12 5.7 22.5 12 22.5 12 18.45 18.3 12 18.3 1.5 12 1.5 12Z" />
          <circle cx="12" cy="12" r="3.1" fill="var(--envista-icon-knockout,#07242b)" />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="2.5" y="4.5" width="19" height="17" rx="2.3" />
          <path d="M6.5 2v5M17.5 2v5" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
          <path d="M4 10h16" stroke="var(--envista-icon-knockout,#07242b)" strokeWidth="1.8" />
          <circle cx="8" cy="14.6" r="1.15" fill="var(--envista-icon-knockout,#07242b)" />
          <circle cx="13" cy="14.6" r="1.15" fill="var(--envista-icon-knockout,#07242b)" />
        </>
      );
    case "verification":
      return (
        <>
          <path d="m12 1.8 2.6 2 3.2.14 1.5 2.9 2.8 1.5-.14 3.2L23 14.2l-2 2.6-.14 3.2-2.9 1.5-1.5 2.8-3.2-.14L10.6 23l-2.6-2-3.2-.14-1.5-2.9-2.8-1.5.14-3.2L.5 10.6l2-2.6.14-3.2 2.9-1.5 1.5-2.8 3.2.14Z" transform="translate(1 0) scale(.92)" />
          <path d="m7.5 12 2.7 2.7 6.25-6.25" fill="none" stroke="var(--envista-icon-knockout,#07242b)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "profile":
      return (
        <>
          <circle cx="12" cy="8.1" r="4.4" />
          <path d="M3.1 20.5a8.9 8.9 0 0 1 17.8 0v1H3.1Z" />
        </>
      );
    default:
      return null;
  }
}

export default function SidebarNavIcon({ href, active, OutlineIcon, size = 20 }: Props) {
  if (!active) return <OutlineIcon size={size} strokeWidth={1.9} fill="none" aria-hidden="true" />;

  const glyph = filledGlyph(href);
  if (!glyph) {
    return <OutlineIcon size={size} strokeWidth={1.9} fill="currentColor" aria-hidden="true" />;
  }

  return (
    <svg
      className="envista-solid-nav-icon"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
}
