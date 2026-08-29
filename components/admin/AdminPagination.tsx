import Link from "next/link";
import styles from "./AdminViews.module.css";

type QueryValue = string | number | null | undefined;

type Props = {
  pathname: string;
  page: number;
  pageSize: number;
  total: number;
  query?: Record<string, QueryValue>;
  pageParam?: string;
};

function pageHref(pathname: string, page: number, pageParam: string, query: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  if (page > 1) params.set(pageParam, String(page));
  else params.delete(pageParam);
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export default function AdminPagination({ pathname, page, pageSize, total, query = {}, pageParam = "page" }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const current = Math.min(Math.max(1, page), pageCount);
  const candidates = [1, current - 1, current, current + 1, pageCount]
    .filter((value) => value >= 1 && value <= pageCount);
  const pages = [...new Set(candidates)].sort((a, b) => a - b);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <span className={styles.paginationInfo}>Mostrando {start}–{end} de {total}</span>
      <div className={styles.paginationActions}>
        {current > 1 ? <Link className={styles.secondary} href={pageHref(pathname, current - 1, pageParam, query)}>← Anterior</Link> : <span className={styles.paginationDisabled}>← Anterior</span>}
        <div className={styles.paginationPages}>
          {pages.map((value, index) => {
            const previous = pages[index - 1];
            return (
              <span key={value} className={styles.paginationPageWrap}>
                {previous && value - previous > 1 ? <span className={styles.paginationEllipsis}>…</span> : null}
                {value === current ? <span className={styles.paginationCurrent} aria-current="page">{value}</span> : <Link className={styles.paginationPage} href={pageHref(pathname, value, pageParam, query)}>{value}</Link>}
              </span>
            );
          })}
        </div>
        {current < pageCount ? <Link className={styles.secondary} href={pageHref(pathname, current + 1, pageParam, query)}>Próxima →</Link> : <span className={styles.paginationDisabled}>Próxima →</span>}
      </div>
    </nav>
  );
}
