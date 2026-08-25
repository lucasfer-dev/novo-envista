export function getGreeting(hour: number) {
  return hour >= 6 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 19 ? "Boa tarde" : "Boa noite";
}

export function validateParticipantLocation(city: string, state: string) {
  return city.trim().length > 0 && state.trim().length > 0;
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
