export const AVATARS = [
  { id: "owl", label: "Owl", emoji: "🦉", bg: "oklch(0.55 0.18 260)" },
  { id: "fox", label: "Fox", emoji: "🦊", bg: "oklch(0.6 0.18 35)" },
  { id: "cat", label: "Cat", emoji: "🐱", bg: "oklch(0.55 0.16 305)" },
  { id: "robot", label: "Robot", emoji: "🤖", bg: "oklch(0.5 0.12 220)" },
  { id: "panda", label: "Panda", emoji: "🐼", bg: "oklch(0.55 0.08 180)" },
  { id: "frog", label: "Frog", emoji: "🐸", bg: "oklch(0.55 0.16 150)" },
  { id: "unicorn", label: "Unicorn", emoji: "🦄", bg: "oklch(0.6 0.16 340)" },
  { id: "astronaut", label: "Astro", emoji: "🧑‍🚀", bg: "oklch(0.5 0.14 280)" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export function avatarById(id?: string | null) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
