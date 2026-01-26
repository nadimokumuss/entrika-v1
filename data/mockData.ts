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

export interface Post {
  id: string;
  content: string;
  category: PostCategory;
  isAnonymous: boolean;
  isSpoiler: boolean;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  reactions: Reaction[];
  commentCount: number;
}

export type Gender = "female" | "male";

export interface User {
  id: string;
  username: string;
  avatar: string;
  gender: Gender;
  reputationScore: number;
  inviteQuota: number;
  invitedBy?: string;
  createdAt: string;
}

export interface ShadowProfile {
  id: string;
  targetName: string;
  identifier: string; // Hashed phone/ig
  city: string;
  avgScore: number;
  totalReviews: number;
  tags: string[];
  createdAt: string;
}

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
    label: "Yılanlık",
    emoji: "🐍",
    color: "#10B981",
    bgColor: "bg-success/20",
  },
  dolandiricilik: {
    label: "Dolandırıcılık",
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
  yanindayim: { emoji: "🫂", label: "Yanındayım" },
  yilan: { emoji: "🐍", label: "Yılan" },
  sok: { emoji: "😱", label: "Şok" },
  helal: { emoji: "👏", label: "Helal" },
};

// Mock Kullanıcılar
export const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "gizli_cicek",
    avatar: "https://api.dicebear.com/7.x/lorelei/png?seed=luna",
    gender: "female",
    reputationScore: 8.7,
    inviteQuota: 3,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    username: "mor_kelebek",
    avatar: "https://api.dicebear.com/7.x/lorelei/png?seed=stella",
    gender: "female",
    reputationScore: 7.2,
    inviteQuota: 2,
    invitedBy: "1",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    username: "cool_guy",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=jack",
    gender: "male",
    reputationScore: 9.1,
    inviteQuota: 5,
    createdAt: "2024-01-10",
  },
];

// Mock Gönderiler
export const MOCK_POSTS: Post[] = [
  {
    id: "1",
    content:
      "3 yıllık ilişkimde aldatıldığımı öğrendim. En yakın arkadaşımla berabermiş. Şu an kendime gelemedim ama burada paylaşmak istedim çünkü içimi dökmem lazımdı.",
    category: "itiraf",
    isAnonymous: true,
    isSpoiler: false,
    authorId: "1",
    authorName: "Anonim",
    authorAvatar: "",
    createdAt: "2 saat önce",
    reactions: [
      { type: "yanindayim", count: 234 },
      { type: "sok", count: 89 },
      { type: "alev", count: 45 },
    ],
    commentCount: 67,
  },
  {
    id: "2",
    content:
      "İstanbul Kadıköy'deki B.Y. isimli kişi hakkında: 6 ay birlikteydik, tüm arkadaşlarına beni \"arkadaşım\" diye tanıttı. Sonradan öğrendim ki nişanlısı varmış. Kanıtlar elimde.",
    category: "ifsa",
    isAnonymous: false,
    isSpoiler: true,
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200",
    authorId: "2",
    authorName: "mor_kelebek",
    authorAvatar: "https://api.dicebear.com/7.x/lorelei/png?seed=stella",
    createdAt: "5 saat önce",
    reactions: [
      { type: "yilan", count: 456 },
      { type: "alev", count: 234 },
      { type: "sok", count: 123 },
    ],
    commentCount: 189,
  },
  {
    id: "3",
    content:
      "Kız arkadaşlar dikkat! Tinder'da tanıştığım adam ilk buluşmada \"yatırım fırsatı\" diye kripto dolandırıcılığı yapmaya çalıştı. Adı Mert, 28 yaşında, Beşiktaş.",
    category: "dolandiricilik",
    isAnonymous: false,
    isSpoiler: true,
    authorId: "3",
    authorName: "anonim_kahraman",
    authorAvatar: "https://api.dicebear.com/7.x/lorelei/png?seed=violet",
    createdAt: "1 gün önce",
    reactions: [
      { type: "helal", count: 345 },
      { type: "alev", count: 123 },
    ],
    commentCount: 78,
  },
  {
    id: "4",
    content:
      "Red flag listesi: Annesinden çok bahseden ama hiç tanıştırmayan, \"mantık evliliği\" konseptini savunan, eski sevgilisinin tüm fotoğraflarını saklayan... Eklemek isteyenler?",
    category: "red_flag",
    isAnonymous: true,
    isSpoiler: false,
    authorId: "1",
    authorName: "Anonim",
    authorAvatar: "",
    createdAt: "2 gün önce",
    reactions: [
      { type: "alev", count: 567 },
      { type: "helal", count: 234 },
      { type: "yanindayim", count: 89 },
    ],
    commentCount: 234,
  },
  {
    id: "5",
    content:
      "Şirketimde yeni başlayan kız var, çok tatlı biri. Ama fark ettim ki sürekli benim fikirlerimi toplantıda kendininmiş gibi sunuyor. Yüzüne söyleyemedim, içimde kaldı.",
    category: "yilanlik",
    isAnonymous: true,
    isSpoiler: false,
    authorId: "2",
    authorName: "Anonim",
    authorAvatar: "",
    createdAt: "3 gün önce",
    reactions: [
      { type: "yilan", count: 289 },
      { type: "yanindayim", count: 156 },
    ],
    commentCount: 92,
  },
  {
    id: "6",
    content:
      "Cilt bakımı için en iyi yatırım: Güneş kremi. Yıllardır her gün kullanıyorum, 35 yaşındayım ama herkes 25 der. La Roche-Posay Anthelios öneririm.",
    category: "tavsiye",
    isAnonymous: false,
    isSpoiler: false,
    authorId: "3",
    authorName: "anonim_kahraman",
    authorAvatar: "https://api.dicebear.com/7.x/lorelei/png?seed=violet",
    createdAt: "4 gün önce",
    reactions: [
      { type: "helal", count: 789 },
      { type: "yanindayim", count: 234 },
    ],
    commentCount: 145,
  },
];

// Mock Gölge Profiller
export const MOCK_SHADOW_PROFILES: ShadowProfile[] = [
  {
    id: "1",
    targetName: "B.Y.",
    identifier: "istanbul_by_123",
    city: "İstanbul",
    avgScore: 2.3,
    totalReviews: 12,
    tags: ["Aldatıcı", "Yalancı", "Ghosting"],
    createdAt: "2024-01-20",
  },
  {
    id: "2",
    targetName: "Mert K.",
    identifier: "istanbul_mk_456",
    city: "İstanbul",
    avgScore: 1.8,
    totalReviews: 8,
    tags: ["Dolandırıcı", "Kripto Scam", "Tinder"],
    createdAt: "2024-02-15",
  },
  {
    id: "3",
    targetName: "A.S.",
    identifier: "ankara_as_789",
    city: "Ankara",
    avgScore: 3.5,
    totalReviews: 5,
    tags: ["Manipülatif", "Love Bombing"],
    createdAt: "2024-03-01",
  },
  {
    id: "4",
    targetName: "Can D.",
    identifier: "izmir_cd_012",
    city: "İzmir",
    avgScore: 1.2,
    totalReviews: 23,
    tags: ["Şiddet", "Tehdit", "Stalker"],
    createdAt: "2024-02-28",
  },
];

// Mevcut kullanıcı (giriş yapmış)
export const CURRENT_USER: User = {
  id: "current",
  username: "yeni_uye",
  avatar: "https://api.dicebear.com/7.x/lorelei/png?seed=luna",
  gender: "female",
  reputationScore: 5.0,
  inviteQuota: 1,
  invitedBy: "1",
  createdAt: "2024-03-15",
};

// Dating profil tipi
export interface DatingProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
  interests: string[];
  job?: string;
  education?: string;
  communityScore: number; // Topluluk puanı (1-10)
  reviewCount: number;
  verifiedProfile: boolean;
  tags: string[]; // Olumlu veya olumsuz etiketler
  lastActive: string;
}

// Mock Dating Profilleri
export const MOCK_DATING_PROFILES: DatingProfile[] = [
  {
    id: "d1",
    name: "Elif",
    age: 26,
    city: "İstanbul",
    bio: "Kitap kurdu 📚 Kahve bağımlısı ☕ Kedilere bayılırım 🐱",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
    ],
    interests: ["Okumak", "Kahve", "Seyahat", "Yoga"],
    job: "Grafik Tasarımcı",
    education: "Mimar Sinan Üniversitesi",
    communityScore: 8.9,
    reviewCount: 15,
    verifiedProfile: true,
    tags: ["Güvenilir", "Samimi", "İyi sohbet"],
    lastActive: "Çevrimiçi",
  },
  {
    id: "d2",
    name: "Ahmet",
    age: 29,
    city: "İstanbul",
    bio: "Yazılımcı 💻 Doğa yürüyüşleri 🏔️ Mutfakta deney yapmayı severim",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    ],
    interests: ["Yazılım", "Doğa", "Yemek", "Fotoğrafçılık"],
    job: "Software Developer",
    education: "Boğaziçi Üniversitesi",
    communityScore: 7.5,
    reviewCount: 8,
    verifiedProfile: true,
    tags: ["Centilmen", "Zeki"],
    lastActive: "1 saat önce",
  },
  {
    id: "d3",
    name: "Zeynep",
    age: 24,
    city: "Ankara",
    bio: "Müzik = Hayat 🎵 Dans etmeyi çok seviyorum 💃 Pozitif enerji",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    ],
    interests: ["Müzik", "Dans", "Sinema", "Spor"],
    job: "Pazarlama Uzmanı",
    communityScore: 9.2,
    reviewCount: 22,
    verifiedProfile: true,
    tags: ["Eğlenceli", "Enerjik", "Dürüst", "Güvenilir"],
    lastActive: "Çevrimiçi",
  },
  {
    id: "d4",
    name: "Burak",
    age: 31,
    city: "İzmir",
    bio: "Girişimci 🚀 Deniz aşığı 🌊 Hayatta bir kez yaşıyoruz",
    photos: [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
    ],
    interests: ["İş", "Yelken", "Golf", "Şarap"],
    job: "Startup Kurucusu",
    education: "Koç Üniversitesi",
    communityScore: 4.2,
    reviewCount: 6,
    verifiedProfile: false,
    tags: ["Belirsiz", "Geç cevap"],
    lastActive: "3 gün önce",
  },
  {
    id: "d5",
    name: "Selin",
    age: 27,
    city: "İstanbul",
    bio: "Veteriner 🐕 Hayvanları insanlardan çok seviyorum 😅 Doğal olmayı tercih ederim",
    photos: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    ],
    interests: ["Hayvanlar", "Doğa", "Bisiklet", "Yoga"],
    job: "Veteriner Hekim",
    education: "İstanbul Üniversitesi",
    communityScore: 8.7,
    reviewCount: 19,
    verifiedProfile: true,
    tags: ["Şefkatli", "Doğal", "İlgili"],
    lastActive: "2 saat önce",
  },
  {
    id: "d6",
    name: "Kaan",
    age: 28,
    city: "İstanbul",
    bio: "Avukat ⚖️ Adalet tutkunu. Tartışmayı severim ama kavgayı değil 😄",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
    ],
    interests: ["Hukuk", "Politika", "Satranç", "Tenis"],
    job: "Avukat",
    education: "Galatasaray Üniversitesi",
    communityScore: 2.8,
    reviewCount: 11,
    verifiedProfile: true,
    tags: ["Manipülatif", "Agresif", "Dikkat!"],
    lastActive: "5 saat önce",
  },
];
