import Link from "next/link";
import styles from "./ContextNav.module.css";

export default function ContextNav({ label, links }: { label: string; links: { href: string; label: string }[] }) {
  return <nav aria-label={label} className={styles.nav}>{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>;
}
