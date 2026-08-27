"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Heart,
  MessageCircle,
  Search,
  Send,
  Share2,
  UserPlus,
  X,
} from "lucide-react";
import {
  addPostCommentAction,
  createPostAction,
  deletePostAction,
  deletePostCommentAction,
  toggleFollowAction,
  togglePostLikeAction,
} from "@/lib/social-real/actions";
import styles from "./LegacySocialFeed.module.css";

export type SocialTeamOption = { id: string; name: string };
export type SocialProjectOption = { id: string; title: string; slug: string };
export type SocialCommentView = { id: string; body: string; userId: string; authorLabel: string };
export type SocialAuthorKind = "participant" | "investor" | "team";

export type SocialPostFeedItem = {
  kind: "post";
  id: string;
  body: string;
  visibility: "private" | "platform";
  createdAt: string;
  authorLabel: string;
  authorHandle: string;
  authorKind: SocialAuthorKind;
  authorHref: string;
  followed: boolean;
  canDelete: boolean;
  liked: boolean;
  likeCount: number;
  comments: SocialCommentView[];
  project?: { id: string; title: string; href: string } | null;
};

export type SocialProjectUpdateFeedItem = {
  kind: "project-update";
  id: string;
  createdAt: string;
  title: string;
  description: string;
  stage: string;
  href: string;
  ownerLabel: string;
  ownerKind: SocialAuthorKind;
  followed: boolean;
  isNew: boolean;
};

export type SocialFeedItem = SocialPostFeedItem | SocialProjectUpdateFeedItem;

export type SocialSuggestion = {
  targetType: "profile" | "team" | "project";
  targetId: string;
  label: string;
  subtitle: string;
  href: string;
};

type FeedMode = "for-you" | "following";
const FEED_BATCH = 12;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function time(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff >= 0 && diff < minute) return "agora";
  if (diff >= minute && diff < hour) return `${Math.floor(diff / minute)}min`;
  if (diff >= hour && diff < day) return `${Math.floor(diff / hour)}h`;
  if (diff >= day && diff < 7 * day) return `${Math.floor(diff / day)}d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function itemText(item: SocialFeedItem) {
  if (item.kind === "post") {
    return `${item.authorLabel} ${item.authorHandle} ${item.body} ${item.project?.title ?? ""}`;
  }
  return `${item.ownerLabel} ${item.title} ${item.description} ${item.stage}`;
}

function kindLabel(kind: SocialAuthorKind) {
  if (kind === "team") return "Equipe";
  if (kind === "investor") return "Investidor";
  return "Participante";
}

export default function LegacySocialFeed({
  userId,
  userName,
  path,
  teams,
  projects,
  items,
  suggestions,
  followingCount,
  status,
  error,
}: {
  userId: string;
  userName: string;
  path: string;
  teams: SocialTeamOption[];
  projects: SocialProjectOption[];
  items: SocialFeedItem[];
  suggestions: SocialSuggestion[];
  followingCount: number;
  status?: string;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [feedMode, setFeedMode] = useState<FeedMode>("for-you");
  const [visibleCount, setVisibleCount] = useState(FEED_BATCH);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const normalized = normalize(query);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (feedMode === "following" && !item.followed) return false;
        return !normalized || normalize(itemText(item)).includes(normalized);
      }),
    [feedMode, items, normalized],
  );

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  const visibleSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) =>
          !normalized || normalize(`${suggestion.label} ${suggestion.subtitle}`).includes(normalized),
      ),
    [suggestions, normalized],
  );

  const hasMore = visibleCount < filteredItems.length;

  useEffect(() => {
    setVisibleCount(FEED_BATCH);
  }, [feedMode, normalized]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((current) => Math.min(current + FEED_BATCH, filteredItems.length));
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredItems.length, hasMore, visibleCount]);

  const sharePost = async (post: SocialPostFeedItem) => {
    const text = `${post.authorLabel}: ${post.body}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Envista", text });
        return;
      } catch {
        // Compartilhamento cancelado: tenta copiar como fallback.
      }
    }
    await navigator.clipboard?.writeText(text);
  };

  return (
    <div className={styles.socialPage}>
      <div className={styles.feedHeader}>
        <div>
          <h1>Social</h1>
          <p>Veja o que pessoas, investidores, equipes e projetos estão construindo no Envista.</p>
        </div>
        <span className={styles.feedBadge}>
          <Activity size={14} /> {followingCount} seguindo
        </span>
      </div>

      {status === "posted" && <div className={styles.notice}>Publicação criada.</div>}
      {error && <div className={styles.error}>Não foi possível concluir essa ação. Tente novamente.</div>}

      <div className={styles.socialLayout}>
        <section className={styles.mainColumn}>
          <div className={`panel ${styles.composer}`}>
            <form action={createPostAction}>
              <input type="hidden" name="return_to" value={path} />
              <div className={styles.composerHead}>
                <span className="avatar">{initials(userName)}</span>
                <textarea
                  required
                  maxLength={5000}
                  name="body"
                  aria-label="Conteúdo da publicação"
                  placeholder="O que está acontecendo no seu projeto, equipe ou jornada?"
                />
              </div>

              <div className={styles.composerMeta}>
                <label>
                  Publicar como
                  <select name="author" defaultValue="personal">
                    <option value="personal">Meu perfil</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>Equipe · {team.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Projeto
                  <select name="project_id" defaultValue="">
                    <option value="">Sem projeto vinculado</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Visibilidade
                  <select name="visibility" defaultValue="platform">
                    <option value="platform">Público no Envista</option>
                    <option value="private">Privado</option>
                  </select>
                </label>
                <button className="primary" type="submit">Publicar</button>
              </div>
            </form>
          </div>

          <div className={styles.timelineToolbar}>
            <div className={styles.feedTabs} role="tablist" aria-label="Filtrar feed">
              <button
                type="button"
                role="tab"
                aria-selected={feedMode === "for-you"}
                className={feedMode === "for-you" ? styles.activeTab : ""}
                onClick={() => setFeedMode("for-you")}
              >
                Para você
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={feedMode === "following"}
                className={feedMode === "following" ? styles.activeTab : ""}
                onClick={() => setFeedMode("following")}
              >
                Seguindo
              </button>
            </div>

            <label className={styles.feedSearch}>
              <Search size={16} />
              <input
                aria-label="Pesquisar no feed"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar no feed"
              />
              {query && (
                <button type="button" aria-label="Limpar pesquisa" onClick={() => setQuery("")}>
                  <X size={15} />
                </button>
              )}
            </label>
          </div>

          <div className={styles.timeline}>
            {visibleItems.map((item) => {
              if (item.kind === "project-update") {
                return (
                  <article className={styles.timelineUpdate} key={item.id}>
                    <div className={styles.identityRow}>
                      <span className={`${styles.timelineAvatar} ${styles.projectAvatar}`}>
                        <FolderKanban size={18} />
                      </span>
                      <div className={styles.identityText}>
                        <div>
                          <b>{item.ownerLabel}</b>
                          <span className={styles.authorKind}>{kindLabel(item.ownerKind)}</span>
                        </div>
                        <small>{item.isNew ? "publicou um projeto" : "atualizou um projeto"} · {time(item.createdAt)}</small>
                      </div>
                      {item.followed && <span className={styles.followingLabel}>Seguindo</span>}
                    </div>

                    <Link className={styles.projectUpdateBody} href={item.href}>
                      <div className={styles.updateTitle}>
                        <strong>{item.title}</strong>
                        <span className="stage">{item.stage}</span>
                      </div>
                      <p>{item.description || "O projeto recebeu uma nova atualização."}</p>
                      <span className={styles.updateAction}>Ver projeto <ArrowRight size={14} /></span>
                    </Link>
                  </article>
                );
              }

              const commentsOpen = Boolean(openComments[item.id]);
              return (
                <article className={styles.timelinePost} key={item.id}>
                  <div className={styles.identityRow}>
                    <Link className={styles.timelineAvatar} href={item.authorHref}>
                      {initials(item.authorLabel)}
                    </Link>
                    <div className={styles.identityText}>
                      <div>
                        <Link href={item.authorHref}><b>{item.authorLabel}</b></Link>
                        <span className={styles.authorKind}>{kindLabel(item.authorKind)}</span>
                      </div>
                      <small>{item.authorHandle} · {time(item.createdAt)}{item.visibility === "private" ? " · Privado" : ""}</small>
                    </div>
                    <div className={styles.postHeaderActions}>
                      {item.followed && <span className={styles.followingLabel}>Seguindo</span>}
                      {item.canDelete && (
                        <form action={deletePostAction}>
                          <input type="hidden" name="post_id" value={item.id} />
                          <input type="hidden" name="return_to" value={path} />
                          <button className={styles.deleteButton} type="submit">Excluir</button>
                        </form>
                      )}
                    </div>
                  </div>

                  <p className={styles.postBody}>{item.body}</p>

                  {item.project && (
                    <Link className={styles.projectReference} href={item.project.href}>
                      <FolderKanban size={17} />
                      <span>
                        <b>{item.project.title}</b>
                        <small>Projeto vinculado</small>
                      </span>
                    </Link>
                  )}

                  <div className={styles.postActions}>
                    <form action={togglePostLikeAction}>
                      <input type="hidden" name="post_id" value={item.id} />
                      <input type="hidden" name="return_to" value={path} />
                      <button className={item.liked ? styles.liked : ""} aria-pressed={item.liked} type="submit">
                        <Heart size={18} fill={item.liked ? "currentColor" : "none"} />
                        <span>{item.likeCount || "Curtir"}</span>
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setOpenComments((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    >
                      <MessageCircle size={18} />
                      <span>{item.comments.length || "Comentar"}</span>
                    </button>
                    <button type="button" onClick={() => sharePost(item)}>
                      <Share2 size={18} />
                      <span>Compartilhar</span>
                    </button>
                  </div>

                  {commentsOpen && (
                    <div className={styles.commentArea}>
                      {item.comments.map((comment) => (
                        <div className={styles.commentRow} key={comment.id}>
                          <span className={styles.commentAvatar}>{initials(comment.authorLabel)}</span>
                          <div>
                            <strong>{comment.authorLabel}</strong>
                            <p>{comment.body}</p>
                            {comment.userId === userId && (
                              <form action={deletePostCommentAction}>
                                <input type="hidden" name="comment_id" value={comment.id} />
                                <input type="hidden" name="return_to" value={path} />
                                <button className={styles.commentDelete} type="submit">Excluir</button>
                              </form>
                            )}
                          </div>
                        </div>
                      ))}
                      <form className={styles.commentComposer} action={addPostCommentAction}>
                        <input type="hidden" name="post_id" value={item.id} />
                        <input type="hidden" name="return_to" value={path} />
                        <input required name="body" maxLength={2000} placeholder="Escreva um comentário..." />
                        <button className="primary square" aria-label="Enviar comentário" type="submit"><Send size={16} /></button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}

            {!filteredItems.length && (
              <div className={styles.emptyFeed}>
                <Activity size={23} />
                <h3>{query ? "Nada encontrado" : feedMode === "following" ? "Você ainda não segue ninguém" : "Ainda não há publicações"}</h3>
                <p>
                  {query
                    ? "Tente outro termo ou limpe a pesquisa."
                    : feedMode === "following"
                      ? "Siga participantes, investidores, equipes e projetos para montar sua timeline."
                      : "Quando alguém publicar no Envista, a publicação vai aparecer aqui."}
                </p>
              </div>
            )}
          </div>

          {hasMore && (
            <div ref={loadMoreRef} className={styles.loadMore} aria-live="polite">
              <span /> Carregando mais publicações...
            </div>
          )}
          {!hasMore && filteredItems.length > FEED_BATCH && (
            <div className={styles.feedEnd}>Você chegou ao fim das publicações carregadas.</div>
          )}
        </section>

        <aside className={styles.sideColumn}>
          <section className={`panel ${styles.sideCard}`}>
            <h3>Quem seguir</h3>
            <p>Pessoas, investidores, equipes e projetos para deixar sua timeline mais interessante.</p>
            <div className={styles.suggestions}>
              {visibleSuggestions.slice(0, 8).map((suggestion) => (
                <div className={styles.suggestion} key={`${suggestion.targetType}:${suggestion.targetId}`}>
                  <span className="avatar">{initials(suggestion.label)}</span>
                  <div className={styles.suggestionIdentity}>
                    <Link href={suggestion.href}>{suggestion.label}</Link>
                    <small>{suggestion.subtitle}</small>
                  </div>
                  <form action={toggleFollowAction}>
                    <input type="hidden" name="target_type" value={suggestion.targetType} />
                    <input type="hidden" name="target_id" value={suggestion.targetId} />
                    <input type="hidden" name="return_to" value={path} />
                    <button className={styles.followButton} type="submit"><UserPlus size={13} /> Seguir</button>
                  </form>
                </div>
              ))}
              {!visibleSuggestions.length && <p className={styles.searchResultLabel}>Nenhuma sugestão encontrada.</p>}
            </div>
          </section>

          <section className={`panel ${styles.sideCard}`}>
            <h3>Feed do Envista</h3>
            <p>
              Participantes e investidores publicam pelo próprio perfil. Membros de equipes também podem publicar em nome do time e vincular a novidade a um projeto.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
