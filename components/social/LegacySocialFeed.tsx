"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bookmark,
  ImagePlus,
  TrendingUp,
  CalendarDays,
  ChevronDown,
  Clock3,
  Code2,
  Compass,
  Flame,
  Settings2,
  Trophy,
  FolderKanban,
  Heart,
  MessageCircle,
  Search,
  Send,
  Share2,
  UserPlus,
  Users,
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
import SocialCompetitionSpotlight from "./SocialCompetitionSpotlight";
import ProjectArtwork from "@/components/product/ProjectArtwork";

export type SocialTeamOption = { id: string; name: string };
export type SocialProjectOption = { id: string; title: string; slug: string };
export type SocialGitHubRepositoryOption = { id: string; fullName: string; private: boolean };
export type SocialCommentView = { id: string; body: string; userId: string; authorLabel: string; authorHref: string; parentCommentId: string | null; avatarUrl?: string | null };
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
  authorAvatarUrl?: string | null;
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
  ownerAvatarUrl?: string | null;
  ownerKind: SocialAuthorKind;
  followed: boolean;
  isNew: boolean;
};

export type SocialFeedItem = SocialPostFeedItem | SocialProjectUpdateFeedItem;

export type SocialAgendaEvent = { id: string; title: string; startsAt: string; href: string | null };

export type SocialSuggestion = {
  targetType: "profile" | "team" | "project";
  targetId: string;
  label: string;
  subtitle: string;
  href: string;
  avatarUrl?: string | null;
};

type FeedMode = "for-you" | "following";

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

function kindLabel(kind: SocialAuthorKind) {
  if (kind === "team") return "Equipe";
  if (kind === "investor") return "Investidor";
  return "Participante";
}

function socialErrorMessage(code?: string) {
  if (!code) return "";
  if (code === "profile-private") return "Seu perfil está privado. Publique como privado ou torne o perfil público nas configurações antes de publicar para todo o Envista.";
  if (code === "team-private") return "Essa equipe está privada. Publique como privado ou altere a visibilidade da equipe antes de publicar para todo o Envista.";
  if (code === "author") return "Você não tem permissão para publicar em nome dessa equipe.";
  if (code === "project") return "Esse projeto não pode ser vinculado à publicação com a sua conta atual.";
  if (code === "comment") return "Não foi possível enviar o comentário. Tente novamente.";
  if (code === "like") return "Não foi possível atualizar a curtida. Tente novamente.";
  if (code === "follow") return "Não foi possível atualizar esse follow. Tente novamente.";
  if (code === "post") return "Não foi possível publicar agora. O texto foi mantido nesta aba para uma nova tentativa.";
  return "Não foi possível concluir essa ação. Tente novamente.";
}

function feedHref(path: string, mode: FeedMode, query: string, page: number) {
  const params = new URLSearchParams();
  if (mode === "following") params.set("mode", "following");
  const cleanQuery = query.trim();
  if (cleanQuery) params.set("q", cleanQuery);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export default function LegacySocialFeed({
  userId,
  userName,
  userAvatarUrl,
  path,
  returnTo,
  teams,
  projects,
  githubRepositories,
  items,
  suggestions,
  followingCount,
  agenda = [],
  feedMode,
  initialQuery,
  page,
  pageCount,
  totalItems,
  status,
  error,
}: {
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  path: string;
  returnTo: string;
  teams: SocialTeamOption[];
  projects: SocialProjectOption[];
  githubRepositories: SocialGitHubRepositoryOption[];
  items: SocialFeedItem[];
  suggestions: SocialSuggestion[];
  followingCount: number;
  agenda?: SocialAgendaEvent[];
  feedMode: FeedMode;
  initialQuery: string;
  page: number;
  pageCount: number;
  totalItems: number;
  status?: string;
  error?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [composerBody, setComposerBody] = useState("");
  const [composerRecovered, setComposerRecovered] = useState(false);
  const [composerSettingsOpen, setComposerSettingsOpen] = useState(false);
  const composerDraftKey = "envista:social-draft:v2:" + userId;
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  const normalized = normalize(query);
  const errorMessage = socialErrorMessage(error);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    try {
      if (status?.startsWith("posted")) {
        window.sessionStorage.removeItem(composerDraftKey);
        setComposerBody("");
        setComposerRecovered(false);
        return;
      }
      const previous = window.sessionStorage.getItem(composerDraftKey);
      if (!previous) return;
      const draft = JSON.parse(previous) as { body?: string; updatedAt?: number };
      if (!draft || typeof draft.body !== "string" || !draft.updatedAt || Date.now() - draft.updatedAt > 86_400_000) {
        window.sessionStorage.removeItem(composerDraftKey);
        return;
      }
      setComposerBody(draft.body);
      setComposerRecovered(Boolean(draft.body.trim()));
    } catch {
      // Browser storage may be unavailable; posting remains usable.
    }
  }, [composerDraftKey, status]);

  function changeComposerBody(body: string) {
    setComposerBody(body);
    try {
      window.sessionStorage.setItem(composerDraftKey, JSON.stringify({ body, updatedAt: Date.now() }));
    } catch {
      // Browser storage is best effort.
    }
  }

  // Real, page-local topics, including project activity (not fabricated
  // platform-wide hashtag counts). A tag is counted once per feed item.
  const topicTerms = [
    { label: "Inovação", term: "inova", query: "inovação" },
    { label: "Educação", term: "educa|aprendiz|escola|mentor", query: "educação" },
    { label: "Sustentabilidade", term: "sustent|residuo|ambient|circular|agua", query: "sustentabilidade" },
    { label: "Tecnologia", term: "tecnolog|digital|aplicativo|plataforma", query: "tecnologia" },
    { label: "Saúde", term: "saude|bem-estar|mental", query: "saúde" },
    { label: "Mobilidade", term: "mobilidade|transporte|rota|acessibilidade", query: "mobilidade" },
    { label: "Projetos", term: "projeto|protótip|solução", query: "projetos" },
  ];
  const topicStats = topicTerms.map(topic => ({
    ...topic,
    count: items.filter(item => {
      if (item.kind === "post" && item.visibility !== "platform") return false;
      const source = item.kind === "post" ? item.body : [item.title, item.description].join(" ");
      return new RegExp(topic.term, "i").test(normalize(source));
    }).length,
  })).filter(topic => topic.count > 0).sort((a, b) => b.count - a.count).slice(0, 4);

  const visibleSuggestions = suggestions.filter(
    (suggestion) => !normalized || normalize(`${suggestion.label} ${suggestion.subtitle}`).includes(normalized),
  );

  const changeMode = (mode: FeedMode) => {
    router.push(feedHref(path, mode, query, 1), { scroll: false });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(feedHref(path, feedMode, query, 1), { scroll: false });
  };

  const clearSearch = () => {
    setQuery("");
    router.push(feedHref(path, feedMode, "", 1), { scroll: false });
  };

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
      {status === "posted" && <div className={styles.notice}>Publicação criada.</div>}
      {status === "posted-github" && <div className={styles.notice}>Publicação criada no Envista e enviada ao GitHub como Discussion.</div>}
      {status === "posted-github-error" && <div className={styles.error}>A publicação entrou no Envista, mas não foi possível enviá-la ao GitHub. Você pode tentar novamente em Integrações.</div>}
      {status === "posted-github-skipped" && <div className={styles.notice}>Publicação criada. A sincronização com GitHub foi ignorada porque o post está privado.</div>}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}

      <div className={styles.socialLayout}>
        <section className={styles.mainColumn}>
      <header className={styles.feedHeader}><h1>Social</h1></header>

          <div className={styles.timelineToolbar}>
            <nav className={styles.feedTabs} aria-label="Filtrar publicações">
              <button
                type="button"
                aria-pressed={feedMode === "for-you"}
                className={feedMode === "for-you" ? styles.activeTab : ""}
                onClick={() => changeMode("for-you")}
              >
                Descobrir
              </button>
              <button
                type="button"
                aria-pressed={feedMode === "following"}
                className={feedMode === "following" ? styles.activeTab : ""}
                onClick={() => changeMode("following")}
              >
                Seguindo
              </button>
            </nav>

            <div className={styles.toolbarRight}>
              <details className={styles.feedSearchToggle}>
                <summary aria-label="Pesquisar no feed" title="Pesquisar no feed"><Search size={17} aria-hidden="true" /></summary>
            <form className={styles.feedSearch} onSubmit={submitSearch}>
              <Search size={16} />
              <input
                aria-label="Pesquisar no feed"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar no feed"
                maxLength={120}
              />
              {query && (
                <button type="button" aria-label="Limpar pesquisa" onClick={clearSearch}>
                  <X size={15} />
                </button>
              )}
            </form>
              </details>
            <span className={styles.sortLabel}><Clock3 size={14} aria-hidden="true" /> Recentes</span>
            </div>
          </div>

          <div className={`panel ${styles.composer}`}>
            <form action={createPostAction}>
              {composerRecovered && error ? <div className={styles.notice} role="status">Sua publicação foi recuperada nesta aba. O texto não foi perdido.</div> : null}
              <input type="hidden" name="return_to" value={path} />
              <div className={styles.composerHead}>
                <span className={styles.composerAvatar}>{userAvatarUrl ? <img src={userAvatarUrl} alt="" /> : initials(userName)}</span>
                <textarea
                  required
                  maxLength={5000}
                  name="body"
                  value={composerBody}
                  onChange={(event) => changeComposerBody(event.target.value)}
                  aria-label="Conteúdo da publicação"
                  placeholder="O que você quer compartilhar com a comunidade?"
                />
              </div>


              <details className={styles.composerOptions} open={composerSettingsOpen} onToggle={event => setComposerSettingsOpen(event.currentTarget.open)}>
                <summary><Settings2 size={15} aria-hidden="true" /> Opções da publicação <ChevronDown size={14} aria-hidden="true" /></summary>
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
                {githubRepositories.length ? (
                  <label>
                    GitHub
                    <select name="github_repository_id" defaultValue="">
                      <option value="">Não sincronizar</option>
                      {githubRepositories.map((repository) => (
                        <option key={repository.id} value={repository.id}>
                          {repository.fullName}{repository.private ? " · privado" : ""}
                        </option>
                      ))}
                    </select>
                    <small>Post público → GitHub Discussion</small>
                  </label>
                ) : null}
                <label>
                  Visibilidade
                  <select name="visibility" defaultValue="private">
                    <option value="private">Privado</option>
                    <option value="platform">Público no Envista</option>
                  </select>
                </label>
              </div>
              </details>
              <div className={styles.composerFooter}>
                <div className={styles.composerShortcuts}>
                  <button type="button" aria-expanded={composerSettingsOpen} onClick={() => setComposerSettingsOpen(value => !value)}>
                    <Settings2 size={17} aria-hidden="true" /> Personalizar publicação
                  </button>
                </div>
                <button className={styles.publishButton} type="submit"><Send size={16} aria-hidden="true" /> Publicar</button>
              </div>
            </form>
          </div>

          <div className={styles.timeline}>
            {items.map((item) => {
              if (item.kind === "project-update") {
                const projectTitle = item.title.trim().toLocaleLowerCase("pt-BR");
                const projectImage = projectTitle === "elovia" ? "/brand/social-elovia-reference.webp"
                  : projectTitle === "elas+" ? "/brand/envista-cover-elas.webp"
                  : projectTitle === "nova" ? "/brand/envista-cover-nova.webp" : null;
                return (
                  <article className={styles.timelineUpdate} key={item.id}>
                    <div className={styles.identityRow}>
                      <span className={styles.timelineAvatar}>
                        {item.ownerAvatarUrl ? <img src={item.ownerAvatarUrl} alt="" /> : initials(item.ownerLabel)}
                      </span>
                      <div className={styles.identityText}>
                        <div><b>{item.ownerLabel}</b><span className={styles.authorKind}>{kindLabel(item.ownerKind)}</span></div>
                        <small>{item.isNew ? "Publicou um novo projeto" : "Atualizou um projeto"} · {time(item.createdAt)}</small>
                      </div>
                      {item.followed && <span className={styles.followingLabel}>Seguindo</span>}
                    </div>
                    <p className={styles.postBody}>
                      {item.isNew ? "Compartilhou um novo projeto: " : "Novidades no projeto: "}
                      <strong>{item.title}</strong>. {item.description}
                    </p>
                    <Link className={styles.projectReference} href={item.href} aria-label={"Conhecer o projeto " + item.title}>
                      <span className={styles.projectCover}>
                        {projectImage
                          ? <img src={projectImage} alt="" loading="lazy" />
                          : <span className={styles.updateArtwork}>
                              <span className={styles.updateArtworkCopy}>
                                <span className={styles.updateArtworkKicker}>PROJETO DA COMUNIDADE</span>
                                <strong>{item.title}</strong>
                                <small>{item.stage}</small>
                              </span>
                              <ProjectArtwork title={item.title} category={item.stage} large />
                            </span>}
                      </span>
                      <span className={styles.projectReferenceCaption}>
                        <FolderKanban size={16} aria-hidden="true" />
                        <span><b>{item.title}</b><small>{item.stage} · Ver projeto</small></span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </span>
                    </Link>
                    <div className={styles.updateFooter}>
                      <span><FolderKanban size={17} aria-hidden="true" /> {item.stage}</span>
                      <Link href={item.href}>Ver projeto <ArrowRight size={16} aria-hidden="true" /></Link>
                    </div>
                  </article>
                );
              }

              const commentsOpen = Boolean(openComments[item.id]);
              return (
                <article className={styles.timelinePost} key={item.id}>
                  <div className={styles.identityRow}>
                    <Link className={styles.timelineAvatar} href={item.authorHref}>
                      {item.authorAvatarUrl ? <img src={item.authorAvatarUrl} alt="" /> : initials(item.authorLabel)}
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
                          <input type="hidden" name="return_to" value={returnTo} />
                          <button className={styles.deleteButton} type="submit">Excluir</button>
                        </form>
                      )}
                    </div>
                  </div>

                  <p className={styles.postBody}>{item.body}</p>

                  {item.project && (
                    <Link className={styles.projectReference} href={item.project.href} aria-label={"Abrir projeto " + item.project.title}>
                      <span className={styles.projectCover}>
                        {item.project.title.trim().toLowerCase() === "elovia"
                          ? <img src="/brand/social-elovia-reference.webp" alt="" loading="lazy" />
                          : item.project.title.trim().toLowerCase() === "elas+"
                            ? <img src="/brand/envista-cover-elas.webp" alt="" loading="lazy" />
                            : item.project.title.trim().toLowerCase() === "nova"
                              ? <img src="/brand/envista-cover-nova.webp" alt="" loading="lazy" />
                              : <FolderKanban size={42} aria-hidden="true" />}
                      </span>
                      <span className={styles.projectReferenceCaption}>
                        <FolderKanban size={16} aria-hidden="true" />
                        <span><b>{item.project.title}</b><small>Conheça o projeto vinculado a esta publicação</small></span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </span>
                    </Link>
                  )}

                  <div className={styles.postActions}>
                    <form action={togglePostLikeAction}>
                      <input type="hidden" name="post_id" value={item.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <button className={item.liked ? styles.liked : ""} aria-pressed={item.liked} type="submit">
                        <Heart size={18} fill={item.liked ? "currentColor" : "none"} />
                        <span>{item.likeCount}</span>
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setOpenComments((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    >
                      <MessageCircle size={18} />
                      <span>{item.comments.length}</span>
                    </button>
                    <button type="button" aria-label="Compartilhar publicação" onClick={() => sharePost(item)}>
                      <Share2 size={19} aria-hidden="true" />
                      <span className={styles.visuallyHidden}>Compartilhar</span>
                    </button>
                    <span className={styles.savePlaceholder} title="Salvar publicações estará disponível em uma atualização futura" aria-label="Salvar publicação: em breve"><Bookmark size={19} aria-hidden="true" /></span>
                  </div>

                  {commentsOpen && (
                    <div className={styles.commentArea}>
                      {item.comments.filter((comment) => !comment.parentCommentId).map((comment) => {
                        const replies = item.comments.filter((reply) => reply.parentCommentId === comment.id);
                        return (
                          <div className={styles.commentThread} key={comment.id}>
                            <div className={styles.commentRow}>
                              <Link className={styles.commentAvatar} href={comment.authorHref} aria-label={`Abrir perfil de ${comment.authorLabel}`}>{comment.avatarUrl ? <img src={comment.avatarUrl} alt="" /> : initials(comment.authorLabel)}</Link>
                              <div>
                                <Link className={styles.commentAuthor} href={comment.authorHref}><strong>{comment.authorLabel}</strong></Link>
                                <p>{comment.body}</p>
                                <div className={styles.commentActions}>
                                  <button type="button" onClick={() => setReplyingTo((current) => ({ ...current, [item.id]: current[item.id] === comment.id ? null : comment.id }))}>Responder</button>
                                  {comment.userId === userId && (
                                    <form action={deletePostCommentAction}>
                                      <input type="hidden" name="comment_id" value={comment.id} />
                                      <input type="hidden" name="return_to" value={returnTo} />
                                      <button className={styles.commentDelete} type="submit">Excluir</button>
                                    </form>
                                  )}
                                </div>
                              </div>
                            </div>
                            {replies.map((reply) => (
                              <div className={`${styles.commentRow} ${styles.commentReply}`} key={reply.id}>
                                <Link className={styles.commentAvatar} href={reply.authorHref} aria-label={`Abrir perfil de ${reply.authorLabel}`}>{reply.avatarUrl ? <img src={reply.avatarUrl} alt="" /> : initials(reply.authorLabel)}</Link>
                                <div>
                                  <Link className={styles.commentAuthor} href={reply.authorHref}><strong>{reply.authorLabel}</strong></Link>
                                  <p>{reply.body}</p>
                                  {reply.userId === userId && (
                                    <form action={deletePostCommentAction}>
                                      <input type="hidden" name="comment_id" value={reply.id} />
                                      <input type="hidden" name="return_to" value={returnTo} />
                                      <button className={styles.commentDelete} type="submit">Excluir</button>
                                    </form>
                                  )}
                                </div>
                              </div>
                            ))}
                            {replyingTo[item.id] === comment.id ? (
                              <form className={styles.replyComposer} action={addPostCommentAction}>
                                <input type="hidden" name="post_id" value={item.id} />
                                <input type="hidden" name="parent_comment_id" value={comment.id} />
                                <input type="hidden" name="return_to" value={returnTo} />
                                <input required name="body" maxLength={2000} placeholder={`Responder a ${comment.authorLabel}…`} autoFocus />
                                <button className="primary square" aria-label="Enviar resposta" type="submit"><Send size={15} /></button>
                              </form>
                            ) : null}
                          </div>
                        );
                      })}
                      <form className={styles.commentComposer} action={addPostCommentAction}>
                        <input type="hidden" name="post_id" value={item.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <input required name="body" maxLength={2000} placeholder="Escreva um comentário..." />
                        <button className="primary square" aria-label="Enviar comentário" type="submit"><Send size={16} /></button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}

            {!items.length && (
              <div className={styles.emptyFeed}>
                <Activity size={23} />
                <h3>{initialQuery ? "Nada encontrado" : feedMode === "following" ? "Você ainda não segue ninguém" : "Ainda não há publicações"}</h3>
                <p>
                  {initialQuery
                    ? "Tente outro termo ou limpe a pesquisa."
                    : feedMode === "following"
                      ? "Encontre pessoas e projetos para acompanhar as atualizações por aqui."
                      : "Quando a comunidade compartilhar novidades, elas aparecerão aqui. Você também pode iniciar a conversa."}
                </p>
                <Link className={styles.emptyFeedAction} href={initialQuery ? feedHref(path, feedMode, "", 1) : "/explore"}>
                  {initialQuery ? "Limpar busca" : "Explorar comunidade"} <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {pageCount > 1 && (
            <nav className={styles.feedPagination} aria-label="Paginação do feed">
              {page > 1 ? (
                <Link className={styles.paginationButton} href={feedHref(path, feedMode, initialQuery, page - 1)}>← Anterior</Link>
              ) : <span />}
              <span>Página {Math.min(page, pageCount)} de {pageCount} · {totalItems} itens</span>
              {page < pageCount ? (
                <Link className={styles.paginationButton} href={feedHref(path, feedMode, initialQuery, page + 1)}>Próxima →</Link>
              ) : <span />}
            </nav>
          )}
        </section>

        <aside className={styles.sideColumn} aria-label="Descobertas da comunidade">
          <SocialCompetitionSpotlight />

          {topicStats.length > 0 && <section className={[styles.sideCard, styles.topicPanel].join(" ")} aria-labelledby="social-topics-title">
            <div className={styles.railTitle}>
              <h2 id="social-topics-title"><Flame size={20} aria-hidden="true" /> Assuntos em alta</h2>
              <Link href="/explore">Ver mais <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
            {topicStats.length ? <>
              <p className={styles.topicContext}>Temas encontrados nas atividades desta página</p>
              <div className={styles.topicList}>
                {topicStats.map(topic => <Link key={topic.label} href={"/explore?q=" + encodeURIComponent(topic.query)}>
                  <span><strong>#{topic.label.replace(/\s+/g, "")}</strong><small>{topic.count} {topic.count === 1 ? "atividade relacionada" : "atividades relacionadas"}</small></span>
                  <TrendingUp size={17} aria-hidden="true" />
                </Link>)}
              </div>
            </> : <div className={styles.railEmpty}><Compass size={20} aria-hidden="true" /><p>Os temas aparecerão conforme a comunidade publicar novas atividades.</p></div>}
          </section>}

          {visibleSuggestions.some(suggestion => suggestion.targetType === "profile") && <section className={[styles.sideCard, styles.peoplePanel].join(" ")} aria-labelledby="social-suggestions-title">
            <div className={styles.railTitle}>
              <h2 id="social-suggestions-title"><Users size={20} aria-hidden="true" /> Sugestões de pessoas</h2>
              <Link href="/explore?type=people">Ver todas <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
            <div className={styles.suggestions}>
              {visibleSuggestions.filter(suggestion => suggestion.targetType === "profile").slice(0, 3).map(suggestion => (
                <div className={styles.suggestion} key={suggestion.targetId}>
                  <span className={styles.suggestionAvatar}>{suggestion.avatarUrl ? <img src={suggestion.avatarUrl} alt="" /> : initials(suggestion.label)}</span>
                  <div className={styles.suggestionIdentity}>
                    <Link href={suggestion.href}>{suggestion.label}</Link>
                    <small>{suggestion.subtitle}</small>
                  </div>
                  <form action={toggleFollowAction}>
                    <input type="hidden" name="target_type" value={suggestion.targetType} />
                    <input type="hidden" name="target_id" value={suggestion.targetId} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button className={styles.followButton} type="submit"><UserPlus size={13} aria-hidden="true" /> Seguir</button>
                  </form>
                </div>
              ))}
              {!visibleSuggestions.some(suggestion => suggestion.targetType === "profile") && <p className={styles.searchResultLabel}>Sem novas pessoas para sugerir agora.</p>}
            </div>
          </section>}

          {agenda.length > 0 && <section className={[styles.sideCard, styles.eventsPanel].join(" ")} aria-labelledby="social-events-title">
            <div className={styles.railTitle}>
              <h2 id="social-events-title"><CalendarDays size={20} aria-hidden="true" /> Próximos eventos</h2>
              <Link href="/calendar">Ver agenda <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
            {agenda.length ? <div className={styles.eventsList}>
              {agenda.map(event => {
                const date = new Date(event.startsAt);
                const valid = !Number.isNaN(date.getTime());
                return <Link key={event.id} href={event.href?.startsWith("/") ? event.href : "/calendar"} className={styles.eventItem}>
                  <span className={styles.eventDate}><strong>{valid ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" }).format(date) : "—"}</strong><small>{valid ? new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).format(date).replace(".", "").toUpperCase() : ""}</small></span>
                  <span><strong>{event.title}</strong><small>{valid ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date) : "Ver no calendário"}</small></span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>;
              })}
            </div> : <div className={styles.railEmpty}><CalendarDays size={19} aria-hidden="true" /><p>Nenhum evento próximo no calendário.</p></div>}
          </section>}
        </aside>
      </div>
    </div>
  );
}