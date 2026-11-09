import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import styles from "./PublicSiteHeader.module.css";

type PublicSiteHeaderProps = {
  context?: "home" | "schools";
};

export default function PublicSiteHeader({ context = "home" }: PublicSiteHeaderProps) {
  const isSchools = context === "schools";
  const howHref = isSchools ? "#como-funciona" : "#como-funciona";
  const learnHref = isSchools ? "#na-pratica" : "#ecossistema";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="Envista — página inicial">
          <Image src="/brand/envista-symbol-gradient.svg" width={33} height={44} alt="" priority />
          <span className={styles.wordmark}>ENVISTA</span>
          <span className={styles.descriptor} aria-hidden="true">ECOSSISTEMA<br />DE INOVAÇÃO</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <div className={styles.navLinks}>
            <a href={howHref} className={styles.navLink}>Como funciona</a>
            <a href={learnHref} className={styles.navLink}>Aprender</a>
            <Link href="/schools" className={styles.navLink} aria-current={isSchools ? "page" : undefined}>Para escolas</Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.signIn}>Entrar</Link>
            <Link href="/register" className={styles.cta}>Começar agora <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </nav>

        <details className={styles.mobileMenu}>
          <summary aria-label="Abrir menu de navegação"><Menu size={22} aria-hidden="true" /></summary>
          <nav aria-label="Navegação no celular">
            <a href={howHref}>Como funciona</a>
            <a href={learnHref}>Aprender</a>
            <Link href="/schools" aria-current={isSchools ? "page" : undefined}>Para escolas</Link>
            <div className={styles.mobileDivider} />
            <Link href="/login">Entrar</Link>
            <Link href="/register" className={styles.mobileCta}>Começar agora <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
