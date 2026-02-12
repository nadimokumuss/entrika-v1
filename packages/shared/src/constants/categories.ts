// Kategori tipleri
export type PostCategory =
  | "itiraf"
  | "ifsa"
  | "red_flag"
  | "yilanlik"
  | "dolandiricilik"
  | "tavsiye";

// Reaksiyon tipleri
export type ReactionType =
  | "alev"
  | "yanindayim"
  | "yilan"
  | "sok"
  | "helal"
  | "begeni"
  | "ofke"
  | "korku"
  | "huzun"
  | "saskinlik";

export interface Reaction {
  type: ReactionType;
  count: number;
}

export type Gender = "female" | "male" | "other";

// Kategori bilgileri
export const CATEGORIES: Record<
  PostCategory,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  itiraf: {
    label: "İtiraf",
    emoji: "🔥",
    color: "#7C3AED",
    bgColor: "bg-primary/20",
  },
  ifsa: {
    label: "İfşa",
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
    label: "Yılanlar",
    emoji: "🐍",
    color: "#10B981",
    bgColor: "bg-success/20",
  },
  dolandiricilik: {
    label: "Dolandırıcılar",
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
  yanindayim: { emoji: "🤝", label: "Yanındayım" },
  yilan: { emoji: "🐍", label: "Yılan" },
  sok: { emoji: "😱", label: "Şok" },
  helal: { emoji: "👏", label: "Helal" },
  begeni: { emoji: "❤️", label: "Beğeni" },
  ofke: { emoji: "😡", label: "Öfke" },
  korku: { emoji: "😨", label: "Korku" },
  huzun: { emoji: "😢", label: "Hüzün" },
  saskinlik: { emoji: "😲", label: "Şaşkınlık" },
};
