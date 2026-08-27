"use client";

import { useMemo, useState } from "react";
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

export type SocialPostFeedItem = {
  kind: "post";
  id: string;
  body: string;
  visibility: "private" | "platform";
  createdAt: string;
  authorLabel: string;
  authorHandle: string;
  authorHref: string;
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
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
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
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const normalized = normalize(query);

  const visibleItems = useMemo(
    () => items.filter((item) => !normalized || normalize(itemText(item)).includes(normalized)),
    [items, normalized],
  );

  const visibleSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) =>
          !normalized || normalize(`${suggestion.label} ${suggestion.subtitle}`).includes(normalized),
      ),
    [suggestions, normalized],
  );

  const sharePost = async (post: SocialPostFeedItem) => {
    const text = `${post.authorLabel}: ${post.body}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Envista", text });
        return;
      } catch {
        // O usuário pode cancelar o compartilhamento; usamos o clipboard como fallback.
      }
    }
    await navigator.clipboard?.writeText(text);
  };

  return (
    <>
      <div className={styles.feedHeader}>
        <div>
          <h1>Social</h1>
          <p>Posts e novidades de pessoas, equipes e projetos que você acompanha.</p>
        </div>
        <span className={styles.feedBadge}>
          <Activity size={14} /> {followingCount} acompanhamento{followingCount === 1 ? "" : "s"}
        </span>
      </div>

      {status === "posted" && <div className={styles.notice}>Publicação criada no seu feed.</div>}
      {error && <div className={styles.error}>Não foi possível concluir essa ação. Tente novamente.</div>}

      <div className="social-layout">
        <section>
          <div className="panel composer">
            <form action={createPostAction}>
              <input type="hidden" name="return_to" value={path} />
              <div className="composer-head">
                <span className="avatar">{initials(userName)}</span>
                <div>
                  <b>Compartilhe uma atualização</b>
                  <small>Publique em seu nome ou represente uma equipe.</small>
                </div>
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
                  Vincular a projeto
                  <select name="project_id" defaultValue="">
                    <option value="">Nenhum projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </label>
              </div>

              <textarea
                required
                maxLength={5000}
                name="body"
                aria-label="Conteúdo da publicação"
                placeholder="Compartilhe um avanço, aprendizado, resultado de teste ou novidade do projeto..."
              />

              <div className={styles.composerFooter}>
                <select className={styles.visibility} name="visibility" defaultValue="platform" aria-label="Visibilidade">
                  <option value="platform">Visível na plataforma</option>
                  <option value="private">Privado para mim/minha equipe</option>
                </select>
                <button className="primary" type="submit">Publicar</button>
              </div>
            </form>
          </div>

          <label className="social-search">
            <Search size={17} />
            <input
              aria-label="Pesquisar no feed"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar no feed, pessoas, equipes ou projetos..."
            />
            {query && (
              <button type="button" className="search-clear" aria-label="Limpar pesquisa" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            )}
          </label>

          <div className={styles.feedList}>
            {visibleItems.map((item) => {
              if (item.kind === "project-update") {
                return (
                  <article className={`panel ${styles.projectUpdate}`} key={item.id}>
                    <div className={styles.updateHeader}>
                      <span className={styles.updateIcon}><FolderKanban size={18} /></span>
                      <div>
                        <b>{item.ownerLabel}</b>
                        <small>{item.isNew ? "Publicou um novo projeto" : "Atualizou um projeto"} · {time(item.createdAt)}</small>
                      </div>
                    </div>
                    <div className={styles.updateTitle}>
                      <Link href={item.href}>{item.title}</Link>
                      <span className="stage">{item.stage}</span>
                    </div>
                    <p className={styles.updateDescription}>{item.description || "O projeto recebeu uma nova atualização."}</p>
                    <Link className={styles.updateAction} href={item.href}>
                      Ver projeto <ArrowRight size={14} />
                    </Link>
                  </article>
                );
              }

              const commentsOpen = Boolean(openComments[item.id]);
              return (
                <article className="panel social-post" key={item.id}>
                  <header>
                    <span className="avatar">{initials(item.authorLabel)}</span>
                    <div>
                      <Link href={item.authorHref}><b>{item.authorLabel}</b></Link>
                      <small>{item.authorHandle} · {time(item.createdAt)} · {item.visibility === "private" ? "Privado" : "Plataforma"}</small>
                    </div>
                    <div className={styles.postHeaderActions}>
                      <span className={styles.followingLabel}>Seguindo</span>
                      {item.canDelete && (
                        <form action={deletePostAction}>
                          <input type="hidden" name="post_id" value={item.id} />
                          <input type="hidden" name="return_to" value={path} />
                          <button className="danger" type="submit">Excluir</button>
                        </form>
                      )}
                    </div>
                  </header>

                  <p className={styles.postBody}>{item.body}</p>

                  {item.project && (
                    <Link className={styles.projectReference} href={item.project.href}>
                      <FolderKanban size={17} />
                      <span>
                        <b>{item.project.title}</b>
                        <small>Projeto vinculado à publicação</small>
                      </span>
                    </Link>
                  )}

                  <footer>
                    <form className={styles.inline} action={togglePostLikeAction}>
                      <input type="hidden" name="post_id" value={item.id} />
                      <input type="hidden" name="return_to" value={path} />
                      <button className={item.liked ? "liked" : ""} aria-pressed={item.liked} type="submit">
                        <Heart size={17} fill={item.liked ? "currentColor" : "none"} /> {item.likeCount}
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setOpenComments((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    >
                      <MessageCircle size={17} /> Comentar {item.comments.length ? `(${item.comments.length})` : ""}
                    </button>
                    <button type="button" onClick={() => sharePost(item)}>
                      <Share2 size={17} /> Compartilhar
                    </button>
                  </footer>

                  {commentsOpen && (
                    <div className={styles.commentArea}>
                      {item.comments.map((comment) => (
                        <div className={styles.commentRow} key={comment.id}>
                          <strong>{comment.authorLabel}</strong>
                          <p>{comment.body}</p>
                          {comment.userId === userId && (
                            <form action={deletePostCommentAction}>
                              <input type="hidden" name="comment_id" value={comment.id} />
                              <input type="hidden" name="return_to" value={path} />
                              <button className={styles.commentDelete} type="submit">Excluir comentário</button>
                            </form>
                          )}
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

            {!visibleItems.length && (
              <div className={`panel ${styles.emptyFeed}`}>
                <Activity size={23} />
                <h3>{query ? "Nada encontrado no feed" : "Seu feed ainda está começando"}</h3>
                <p>
                  {query
                    ? "Tente outro termo ou limpe a pesquisa."
                    : "Siga pessoas, equipes ou projetos. Quando eles publicarem ou um projeto evoluir, a novidade aparece aqui."}
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="social-side">
          <section className={`panel ${styles.sideCard}`}>
            <h3>Descobrir para seguir</h3>
            <p>Monte seu feed acompanhando pessoas, equipes e projetos relevantes.</p>
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
            <h3>Como o feed funciona</h3>
            <p>
              Publicações das pessoas e equipes que você segue aparecem junto das novidades dos projetos acompanhados, em ordem de atualização.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
