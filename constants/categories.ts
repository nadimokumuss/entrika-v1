// Kategori tipleri
export type PostCategory =
  | "itiraf"
  | "ifsa"
  | "red_flag"
  | "yilanlik"
  | "dolandiricilik"
  | "tavsiye";

// Reaksiyon tipleri
export type ReactionType = "alev" | "yanindayim" | "yilan" | "sok" | "helal";

export interface Reaction {
  type: ReactionType;
  count: number;
}

export type Gender = "female" | "male";

// Kategori bilgileri
export const CATEGORIES: Record<
  PostCategory,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  itiraf: {
    label: "Itiraf",
    emoji: "🔥",
    color: "#7C3AED",
    bgColor: "bg-primary/20",
  },
  ifsa: {
    label: "Ifsa",
    emoji: "⚠️",
    color: "#EC4899",
    bgColor: "bg-danger/20",
  },
  red_flag: {
    label: "Red Flag",
    emoji: "🚩",
    color: "#EF4444",
    bgColor: "bg-red-500/20",
  },
  yilanlik: {
    label: "Yilanlik",
    emoji: "🐍",
    color: "#10B981",
    bgColor: "bg-success/20",
  },
  dolandiricilik: {
    label: "Dolandiricilik",
    emoji: "💸",
    color: "#F59E0B",
    bgColor: "bg-amber-500/20",
  },
  tavsiye: {
    label: "Tavsiye",
    emoji: "💅",
    color: "#8B5CF6",
    bgColor: "bg-violet-500/20",
  },
};

// Reaksiyon bilgileri
export const REACTIONS: Record<
  ReactionType,
  { emoji: string; label: string }
> = {
  alev: { emoji: "🔥", label: "Olay" },
  yanindayim: { emoji: "🫂", label: "Yanindayim" },
  yilan: { emoji: "🐍", label: "Yilan" },
  sok: { emoji: "😱", label: "Sok" },
  helal: { emoji: "👏", label: "Helal" },
};
