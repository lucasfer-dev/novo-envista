"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  GitCommitHorizontal,
  GitFork,
  Github,
  GitPullRequest,
  Globe2,
  Loader2,
  Lock,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Unplug,
  UsersRound,
  X,
} from "lucide-react";
import styles from "./GitHubIntegration.module.css";

type Connection = {
  installation_id: string | number;
  github_account_id: string | number;
  github_login: string;
  github_avatar_url: string | null;
  github_html_url: string;
  github_account_type: string | null;
  connected_at: string;
  updated_at: string;
};

type Repository = {
  github_repo_id: string | number;
  name: string;
  full_name: string;
  owner_login: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics: string[] | null;
  display_on_profile: boolean;
  github_updated_at: string | null;
  synced_at: string;
};

type GitHubEvent = {
  id: string;
  event_type: string;
  event_action: string | null;
  title: string;
  summary: string | null;
  repository_full_name: string | null;
  repository_html_url: string | null;
  event_html_url: string | null;
  is_public: boolean;
  occurred_at: string;
};

type Props = {
  configured: boolean;
  connection: Connection | null;
  repositories: Repository[];
  events: GitHubEvent[];
  initialStatus: string | null;
  initialError: string | null;
};

type PublishKind = "discussion" | "release" | "issue";

const ERROR_COPY: Record<string, string> = {
  not_configured: "A integração ainda precisa das credenciais do GitHub App no ambiente de produção.",
  invalid_state: "A conexão expirou ou não pôde ser validada. Tente conectar novamente.",
  invalid_installation: "O GitHub não retornou uma instalação válida.",
  connection_failed: "Não foi possível finalizar a conexão com o GitHub.",
};

const STATUS_COPY: Record<string, string> = {
  connected: "GitHub conectado e repositórios sincronizados.",
  updated: "Permissões e repositórios do GitHub atualizados.",
};

function formatRelativeDate(value: string | null) {
  if (!value) return "agora";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return date.toLocaleDateString("pt-BR");
}

function eventIcon(type: string) {
  if (type === "release") return Tag;
  if (type === "pull_request") return GitPullRequest;
  if (type === "issue") return CircleDot;
  if (type === "discussion") return MessageSquareText;
  if (type === "envista_publish") return Send;
  return GitCommitHorizontal;
}

export default function GitHubIntegrationClient({
  configured,
  connection,
  repositories: initialRepositories,
  events,
  initialStatus,
  initialError,
}: Props) {
  const [repositories, setRepositories] = useState(initialRepositories);
  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(
    initialError ? ERROR_COPY[initialError] || "Não foi possível concluir a ação." : initialStatus ? STATUS_COPY[initialStatus] || "Ação concluída." : "",
  );
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">(initialError ? "error" : "success");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishKind, setPublishKind] = useState<PublishKind>("discussion");
  const [selectedRepositoryId, setSelectedRepositoryId] = useState(
    initialRepositories[0] ? String(initialRepositories[0].github_repo_id) : "",
  );
  const [publishTitle, setPublishTitle] = useState("");
  const [publishBody, setPublishBody] = useState("");
  const [tagName, setTagName] = useState("");

  const filteredRepositories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return repositories;
    return repositories.filter((repo) =>
      [repo.name, repo.full_name, repo.description || "", repo.language || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, repositories]);

  const filteredEvents = useMemo(() => {
    if (activityFilter === "all") return events;
    if (activityFilter === "commits") return events.filter((event) => event.event_type === "push");
    if (activityFilter === "releases") return events.filter((event) => event.event_type === "release");
    if (activityFilter === "issues") return events.filter((event) => event.event_type === "issue");
    if (activityFilter === "discussions") {
      return events.filter((event) => event.event_type === "discussion" || event.event_action === "discussion");
    }
    return events;
  }, [activityFilter, events]);

  const stats = useMemo(() => {
    const publicRepos = repositories.filter((repo) => !repo.private).length;
    const stars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const profileRepos = repositories.filter((repo) => repo.display_on_profile).length;
    return {
      repositories: repositories.length,
      publicRepos,
      stars,
      profileRepos,
    };
  }, [repositories]);

  function showFeedback(message: string, kind: "success" | "error" = "success") {
    setFeedback(message);
    setFeedbackKind(kind);
  }

  async function sync() {
    setBusy("sync");
    showFeedback("");
    try {
      const response = await fetch("/api/github/sync", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao sincronizar.");
      showFeedback(`${data.repositories || 0} repositórios sincronizados.`);
      window.location.reload();
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Falha ao sincronizar.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!window.confirm("Desconectar o GitHub do Envista? Seus dados sincronizados serão removidos do Envista.")) return;
    setBusy("disconnect");
    try {
      const response = await fetch("/api/github/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Não foi possível desconectar.");
      window.location.reload();
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Falha ao desconectar.", "error");
      setBusy(null);
    }
  }

  async function toggleProfileRepository(repo: Repository) {
    const repositoryId = String(repo.github_repo_id);
    const nextValue = !repo.display_on_profile;
    setBusy(`repo-${repositoryId}`);
    try {
      const response = await fetch("/api/github/repositories/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, displayOnProfile: nextValue }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível alterar a visibilidade.");
      setRepositories((current) =>
        current.map((item) =>
          String(item.github_repo_id) === repositoryId
            ? { ...item, display_on_profile: nextValue }
            : item,
        ),
      );
      showFeedback(nextValue ? "Repositório adicionado ao perfil." : "Repositório removido do perfil.");
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Não foi possível salvar.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRepositoryId) {
      showFeedback("Escolha um repositório.", "error");
      return;
    }

    setBusy("publish");
    try {
      const response = await fetch("/api/github/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: selectedRepositoryId,
          kind: publishKind,
          title: publishTitle,
          body: publishBody,
          tagName,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível publicar no GitHub.");
      setPublishOpen(false);
      setPublishTitle("");
      setPublishBody("");
      setTagName("");
      showFeedback("Publicado no GitHub com sucesso.");
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Não foi possível publicar.", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMark}>
          <img src="/brand/envista-symbol-gradient.svg" alt="" />
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>ENVISTA × GITHUB</span>
          <h1>Seu código também conta a sua história.</h1>
          <p>Conecte seus repositórios, transforme atividade técnica em portfólio e publique no GitHub sem sair do Envista.</p>
        </div>
        <div className={styles.heroBadge}>
          <ShieldCheck size={17} />
          GitHub App · permissões por repositório
        </div>
      </section>

      {feedback ? (
        <div className={feedbackKind === "error" ? styles.feedbackError : styles.feedbackSuccess}>
          {feedbackKind === "error" ? <CircleDot size={17} /> : <CheckCircle2 size={17} />}
          <span>{feedback}</span>
        </div>
      ) : null}

      <section className={styles.connectionCard}>
        <div className={styles.connectionIcon}><Github size={28} /></div>
        <div className={styles.connectionCopy}>
          <div className={styles.connectionTitleRow}>
            <h2>Integração com GitHub</h2>
            {connection ? <span className={styles.connected}><i /> Conectado</span> : <span className={styles.disconnected}>Desconectado</span>}
          </div>
          <p>Importe repositórios, acompanhe atividade e leve atualizações do Envista para Discussions, Releases e Issues.</p>
          {connection ? (
            <a className={styles.accountIdentity} href={connection.github_html_url} target="_blank" rel="noreferrer">
              {connection.github_avatar_url ? <img src={connection.github_avatar_url} alt="" /> : <span><Github size={15} /></span>}
              <b>@{connection.github_login}</b>
              <small>{connection.github_account_type || "GitHub"}</small>
              <ExternalLink size={13} />
            </a>
          ) : null}
        </div>
        <div className={styles.connectionActions}>
          {connection ? (
            <>
              <button className={styles.secondaryButton} onClick={sync} disabled={busy !== null}>
                {busy === "sync" ? <Loader2 className={styles.spin} size={16} /> : <RefreshCw size={16} />}
                Sincronizar
              </button>
              <button className={styles.ghostButton} onClick={disconnect} disabled={busy !== null}>
                <Unplug size={16} />
                Desconectar
              </button>
            </>
          ) : (
            <a
              className={styles.primaryButton}
              href={configured ? "/api/github/connect" : "#config"}
              onClick={(event) => {
                if (!configured) {
                  event.preventDefault();
                  showFeedback("Configure o GitHub App no ambiente antes de conectar.", "error");
                }
              }}
            >
              <Github size={17} />
              Conectar GitHub
            </a>
          )}
        </div>
      </section>

      {connection ? (
        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>REPOSITÓRIOS</span>
                  <h2>Projetos conectados</h2>
                  <p>Os públicos entram no seu perfil por padrão. Você pode ocultar qualquer um.</p>
                </div>
                <div className={styles.repoTools}>
                  <label className={styles.searchBox}>
                    <Search size={15} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar repositórios..." />
                  </label>
                </div>
              </div>

              {filteredRepositories.length ? (
                <div className={styles.repoGrid}>
                  {filteredRepositories.map((repo) => (
                    <article className={styles.repoCard} key={String(repo.github_repo_id)}>
                      <div className={styles.repoTop}>
                        <div className={styles.repoName}>
                          <Code2 size={17} />
                          <a href={repo.html_url} target="_blank" rel="noreferrer">{repo.name}</a>
                          <span className={repo.private ? styles.privateBadge : styles.publicBadge}>
                            {repo.private ? <Lock size={11} /> : <Globe2 size={11} />}
                            {repo.private ? "Privado" : "Público"}
                          </span>
                        </div>
                        {!repo.private ? (
                          <button
                            className={styles.profileToggle}
                            disabled={busy === `repo-${repo.github_repo_id}`}
                            onClick={() => toggleProfileRepository(repo)}
                            title={repo.display_on_profile ? "Ocultar do perfil" : "Mostrar no perfil"}
                          >
                            {busy === `repo-${repo.github_repo_id}` ? <Loader2 className={styles.spin} size={15} /> : repo.display_on_profile ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        ) : null}
                      </div>
                      <p>{repo.description || "Repositório conectado ao Envista."}</p>
                      <div className={styles.repoFooter}>
                        <span>{repo.language || "Código"}</span>
                        <span><Star size={13} /> {repo.stargazers_count || 0}</span>
                        <span><GitFork size={13} /> {repo.forks_count || 0}</span>
                        <time>{formatRelativeDate(repo.github_updated_at)}</time>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Github size={30} />
                  <h3>Nenhum repositório encontrado.</h3>
                  <p>Sincronize novamente ou ajuste sua busca.</p>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>ATIVIDADE</span>
                  <h2>Atividade recente</h2>
                  <p>Webhooks transformam commits, PRs, releases, issues e discussions em sinais de progresso.</p>
                </div>
                <div className={styles.filters}>
                  {[
                    ["all", "Tudo"],
                    ["commits", "Commits"],
                    ["releases", "Releases"],
                    ["issues", "Issues"],
                    ["discussions", "Discussões"],
                  ].map(([value, label]) => (
                    <button key={value} data-active={activityFilter === value} onClick={() => setActivityFilter(value)}>{label}</button>
                  ))}
                </div>
              </div>

              {filteredEvents.length ? (
                <div className={styles.activityList}>
                  {filteredEvents.map((item) => {
                    const Icon = eventIcon(item.event_type);
                    return (
                      <a
                        className={styles.activityItem}
                        key={item.id}
                        href={item.event_html_url || item.repository_html_url || "#"}
                        target={item.event_html_url || item.repository_html_url ? "_blank" : undefined}
                        rel="noreferrer"
                      >
                        <span className={styles.activityIcon}><Icon size={16} /></span>
                        <span className={styles.activityCopy}>
                          <b>{item.title}</b>
                          <small>{item.summary || item.repository_full_name || "Atividade sincronizada do GitHub."}</small>
                        </span>
                        <time>{formatRelativeDate(item.occurred_at)}</time>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyActivity}>
                  <GitCommitHorizontal size={24} />
                  <div><b>A atividade vai aparecer aqui.</b><span>Depois da conexão, os eventos recebidos pelo GitHub entram neste histórico.</span></div>
                </div>
              )}
            </section>
          </div>

          <aside className={styles.rightRail}>
            <section className={styles.publishCard}>
              <span className={styles.sectionEyebrow}>ENVISTA → GITHUB</span>
              <h2>Publique sem trocar de contexto.</h2>
              <p>Crie uma Discussion, Release ou Issue diretamente do Envista.</p>
              <button className={styles.primaryButton} onClick={() => setPublishOpen(true)} disabled={!repositories.length}>
                <Plus size={16} />
                Publicar no GitHub
              </button>
            </section>

            <section className={styles.spotlightCard}>
              <Sparkles size={20} />
              <span>PORTFÓLIO VIVO</span>
              <h3>Do código para uma história maior.</h3>
              <p>Repositórios públicos selecionados aparecem no perfil Envista junto das atividades que comprovam evolução real.</p>
            </section>

            <section className={styles.statsCard}>
              <h3>GitHub no Envista</h3>
              <div><Code2 size={17} /><span><b>{stats.repositories}</b><small>repositórios</small></span></div>
              <div><Globe2 size={17} /><span><b>{stats.publicRepos}</b><small>públicos</small></span></div>
              <div><Eye size={17} /><span><b>{stats.profileRepos}</b><small>no perfil</small></span></div>
              <div><Star size={17} /><span><b>{stats.stars}</b><small>stars somadas</small></span></div>
            </section>

            <section className={styles.securityCard}>
              <ShieldCheck size={18} />
              <div>
                <b>Sem token permanente salvo</b>
                <p>O Envista usa tokens temporários da instalação do GitHub App e respeita os repositórios autorizados.</p>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <section className={styles.onboardingGrid}>
          <article>
            <Github size={24} />
            <h3>1. Conecte</h3>
            <p>Instale o GitHub App e escolha quais repositórios o Envista pode acessar.</p>
          </article>
          <article>
            <RefreshCw size={24} />
            <h3>2. Sincronize</h3>
            <p>Repos e atividade técnica ganham uma apresentação consistente com o seu perfil.</p>
          </article>
          <article>
            <Send size={24} />
            <h3>3. Publique</h3>
            <p>Envie Discussions, Releases e Issues a partir do próprio Envista.</p>
          </article>
        </section>
      )}

      {!configured ? (
        <section className={styles.configNotice} id="config">
          <Github size={19} />
          <div>
            <b>Configuração necessária para ativar em produção</b>
            <p>Defina GITHUB_APP_ID, GITHUB_APP_SLUG e a chave privada em base64. Webhooks também usam GITHUB_APP_WEBHOOK_SECRET e SUPABASE_SERVICE_ROLE_KEY.</p>
          </div>
        </section>
      ) : null}

      {publishOpen ? (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPublishOpen(false);
        }}>
          <form className={styles.modal} onSubmit={publish}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.sectionEyebrow}>PUBLICAR NO GITHUB</span>
                <h2>Transforme uma atualização em ação.</h2>
                <p>O conteúdo é enviado usando a instalação conectada do GitHub App.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setPublishOpen(false)} aria-label="Fechar">
                <X size={19} />
              </button>
            </div>

            <div className={styles.kindGrid}>
              {([
                ["discussion", MessageSquareText, "Discussion", "Conversa, anúncio ou feedback"],
                ["release", Tag, "Release", "Versão e notas de lançamento"],
                ["issue", CircleDot, "Issue", "Bug, tarefa ou melhoria"],
              ] as const).map(([kind, Icon, title, description]) => (
                <button
                  type="button"
                  key={kind}
                  data-active={publishKind === kind}
                  onClick={() => setPublishKind(kind)}
                >
                  <Icon size={18} />
                  <span><b>{title}</b><small>{description}</small></span>
                </button>
              ))}
            </div>

            <label className={styles.field}>
              <span>Repositório</span>
              <select value={selectedRepositoryId} onChange={(event) => setSelectedRepositoryId(event.target.value)} required>
                {repositories.map((repo) => <option key={String(repo.github_repo_id)} value={String(repo.github_repo_id)}>{repo.full_name}</option>)}
              </select>
            </label>

            {publishKind === "release" ? (
              <label className={styles.field}>
                <span>Tag / versão</span>
                <input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="v1.0.0" required />
              </label>
            ) : null}

            <label className={styles.field}>
              <span>Título</span>
              <input value={publishTitle} onChange={(event) => setPublishTitle(event.target.value)} placeholder="O que mudou?" maxLength={180} required />
            </label>

            <label className={styles.field}>
              <span>Conteúdo</span>
              <textarea value={publishBody} onChange={(event) => setPublishBody(event.target.value)} placeholder="Conte a atualização, contexto, resultado ou próximos passos..." rows={8} required />
            </label>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setPublishOpen(false)}>Cancelar</button>
              <button type="submit" className={styles.primaryButton} disabled={busy === "publish"}>
                {busy === "publish" ? <Loader2 className={styles.spin} size={16} /> : <Send size={16} />}
                Publicar {publishKind === "discussion" ? "Discussion" : publishKind === "release" ? "Release" : "Issue"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
