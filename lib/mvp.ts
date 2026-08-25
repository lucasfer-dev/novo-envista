export function getGreeting(hour: number) {
  return hour >= 6 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 19 ? "Boa tarde" : "Boa noite";
}

export function validateParticipantLocation(city: string, state: string) {
  return city.trim().length > 0 && state.trim().length > 0;
}

export type OnboardingValidationValues = {
  name: string;
  username: string;
  city: string;
  state: string;
  organizationType: string;
  organizationName: string;
  location: string;
  description: string;
  participantSkills: string[];
  participantGoals: string[];
  investorSectors: string[];
  investorStages: string[];
};

export function getOnboardingValidationError(
  role: "participant" | "investor",
  step: number,
  values: OnboardingValidationValues,
) {
  if (role === "participant") {
    if (step === 1 && (!values.name.trim() || !values.username.trim()))
      return "Preencha Nome e Username para continuar.";
    if (step === 2 && !validateParticipantLocation(values.city, values.state))
      return "Preencha Cidade e Estado para continuar.";
    if (step === 3 && values.participantSkills.length === 0)
      return "Selecione pelo menos uma habilidade para continuar.";
    if (step === 4 && values.participantGoals.length === 0)
      return "Selecione pelo menos um objetivo inicial para continuar.";
    return "";
  }

  if (step === 1 && !values.name.trim())
    return "Preencha Nome para continuar.";
  if (step === 1 && !values.organizationType.trim())
    return "Selecione o Tipo de organização para continuar.";
  if (step === 1 && values.organizationType !== "Pessoa física" && !values.organizationName.trim())
    return "Informe o nome da organização para continuar.";
  if (step === 2 && (!values.location.trim() || !values.description.trim()))
    return "Preencha Localização e Descrição para continuar.";
  if (step === 3 && values.investorSectors.length === 0)
    return "Selecione pelo menos um setor de interesse para continuar.";
  if (step === 4 && values.investorStages.length === 0)
    return "Selecione pelo menos um estágio preferido para continuar.";
  return "";
}

export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function canFollowProject(authorType: "user" | "team", authorId: string) {
  return authorId !== "u1" && !(authorType === "team" && ["t1", "t2"].includes(authorId));
}

export function toggleSocialPostLike<T extends { id: string; likes: number }>(
  posts: T[],
  likedPostIds: string[],
  postId: string,
) {
  const wasLiked = likedPostIds.includes(postId);

  return {
    posts: posts.map((post) =>
      post.id === postId
        ? { ...post, likes: Math.max(0, post.likes + (wasLiked ? -1 : 1)) }
        : post,
    ),
    likedPostIds: wasLiked
      ? likedPostIds.filter((id) => id !== postId)
      : [...new Set([...likedPostIds, postId])],
    liked: !wasLiked,
  };
}
