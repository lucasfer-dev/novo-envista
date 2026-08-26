export type SocialPost = {
  id: string;
  author: string;
  handle: string;
  body: string;
  likes: number;
  time: string;
  image?: string;
  comments?: Array<{ id: string; author: string; text: string }>;
};

export type FollowableEntityKind = "participant" | "investor" | "team";

export const seedSocialPosts: SocialPost[] = [
  {
    id: "s1",
    author: "Equipe Atlas",
    handle: "@atlas",
    body: "Fechamos uma nova rodada de testes do Aqua. O sensor está mais estável e agora vamos validar em ambiente escolar.",
    likes: 18,
    time: "2h",
  },
  {
    id: "s2",
    author: "Ana Souza",
    handle: "@anasouza",
    body: "Fim de semana de competição e muita coisa aprendida. Documentar o que deu errado foi tão importante quanto o resultado.",
    likes: 31,
    time: "5h",
  },
  {
    id: "s3",
    author: "Equipe Orion",
    handle: "@orion",
    body: "O EduMatch ganhou um fluxo novo para organizar oportunidades educacionais por interesse.",
    likes: 12,
    time: "1d",
  },
];

export function entityFollowKey(kind: FollowableEntityKind, id: string) {
  return `${kind}:${id}`;
}

export function toggleEntityFollow(current: string[], key: string) {
  return current.includes(key)
    ? current.filter((item) => item !== key)
    : [...new Set([...current, key])];
}
