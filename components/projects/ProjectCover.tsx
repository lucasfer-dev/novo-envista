"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./ProjectCard.module.css";

export default function ProjectCover({ title, category, src, large = false }: { title: string; category?: string | null; src?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const tone = Array.from(title).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 3;
  return <div className={`${styles.cover} ${large ? styles.large : ""}`} data-tone={tone}>
    {src && !failed ? <Image src={src} alt={`Imagem do projeto ${title}`} fill unoptimized sizes={large ? "(max-width: 800px) 100vw, 1000px" : "(max-width: 800px) 100vw, 400px"} onError={() => setFailed(true)} /> : <div className={styles.abstract} aria-label={`Capa do projeto ${title}`}>
      <Image className={styles.mark} src="/brand/envista-symbol-white.svg" alt="" width={110} height={140} />
      <span>{category || "Projeto Envista"}</span><strong>{title}</strong>
    </div>}
  </div>;
}
