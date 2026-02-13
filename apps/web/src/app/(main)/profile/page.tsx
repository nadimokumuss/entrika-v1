"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { followingLib } from "@/lib/shared";
import { CATEGORIES, REACTIONS } from "@entrika/shared";
import { Settings, Edit3, Heart, Star, MapPin, Briefcase, MessageCircle, Users } from "lucide-react";
import Link from "next/link";

interface Review {
  id: string;
  reviewer_id: string;
  score: number;
  positive_tags: string[];
  negative_tags: string[];
  content: string | null;
  is_anonymous: boolean;
  created_at: string;
  reviewer?: { username: string; avatar_url: string | null };
}

interface UserPost {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  created_at: string;
  comment_count: number;
  reaction_count: number;
}

interface UserComment {
  id: string;
  content: string;
  is_anonymous: boolean;
  parent_id: string | null;
  created_at: string;
  post_id: string;
  posts: { id: string; content: string } | null;
}

interface UserReaction {
  id: string;
  reaction_type: string;
  created_at: string;
  post_id: string;
  posts: {
    id: string;
    content: string;
    is_anonymous: boolean;
    author_id: string;
    profiles: { username: string };
  } | null;
}

type TabType = "posts" | "comments" | "reactions" | "reviews";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [postCount, setPostCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [tab, setTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [userReactions, setUserReactions] = useState<UserReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null);
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const [
        { count: pCount },
        counts,
        { count: rCount },
        { data: datingData },
      ] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", user.id),
        followingLib.getFollowCounts(user.id),
        supabase.from("user_reviews").select("*", { count: "exact", head: true }).eq("target_user_id", user.id),
        supabase.from("dating_profiles").select("relationship_status, partner_id").eq("user_id", user.id).single(),
      ]);

      setPostCount(pCount || 0);
      setFollowersCount(counts.followersCount);
      setFollowingCount(counts.followingCount);
      setReviewCount(rCount || 0);

      if (datingData) {
        setRelationshipStatus(datingData.relationship_status);
        if (datingData.partner_id) {
          const { data: partnerData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", datingData.partner_id)
            .single();
          if (partnerData) setPartnerUsername(partnerData.username);
        }
      }

      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (tab === "posts") loadPosts();
    else if (tab === "reviews") loadReviews();
    else if (tab === "comments") loadComments();
    else if (tab === "reactions") loadReactions();
  }, [tab, user]);

  const loadPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("posts")
      .select("id, content, category, is_anonymous, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data || []).map((p: any) => ({ ...p, comment_count: 0, reaction_count: 0 })));
  };

  const loadReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_reviews")
      .select("*, reviewer:profiles!user_reviews_reviewer_id_fkey(username, avatar_url)")
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setReviews(data || []);
  };

  const loadComments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("comments")
      .select("id, content, is_anonymous, parent_id, created_at, post_id, posts(id, content)")
      .eq("author_id", user.id)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(50);
    setUserComments((data as unknown as UserComment[]) || []);
  };

  const loadReactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("post_reactions")
      .select("id, reaction_type, created_at, post_id, posts(id, content, is_anonymous, author_id, profiles(username))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setUserReactions((data as unknown as UserReaction[]) || []);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "az once";
    if (mins < 60) return `${mins}dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa`;
    return `${Math.floor(hours / 24)}g`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "var(--success)";
    if (score >= 6) return "var(--primary)";
    if (score >= 4) return "var(--warning)";
    return "var(--danger)";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Mukemmel";
    if (score >= 7) return "Cok Iyi";
    if (score >= 5) return "Iyi";
    if (score >= 3) return "Orta";
    return "Dusuk";
  };

  if (!profile) return null;

  const repScore = profile.reputation_score ?? 0;

  const tabs: [TabType, string][] = [
    ["posts", "Paylasimlar"],
    ["comments", "Yorumlar"],
    ["reactions", "Tepkiler"],
    ["reviews", "Degerlendirmeler"],
  ];

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text)]">Profil</h1>
        <Link href="/settings" className="p-2 rounded-lg hover:bg-[var(--card)]" aria-label="Ayarlar">
          <Settings size={20} className="text-[var(--text-muted)]" />
        </Link>
      </div>

      <div className="px-4 py-6">
        {/* Avatar & Info */}
        <div className="flex items-start gap-4">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${profile.id}`}
            alt={profile.username}
            className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-light)]"
          />
          <div className="flex-1">
            {profile.full_name && (
              <p className="text-lg font-bold text-[var(--text)]">{profile.full_name}</p>
            )}
            <p className="text-sm text-[var(--text-muted)]">@{profile.username}</p>
            {profile.bio && <p className="mt-1 text-sm text-[var(--text)]">{profile.bio}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.city && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <MapPin size={12} /> {profile.city}
                </span>
              )}
              {profile.occupation && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Briefcase size={12} /> {profile.occupation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="text-center flex-1">
            <p className="font-bold text-[var(--text)]">{postCount}</p>
            <p className="text-xs text-[var(--text-muted)]">Paylasim</p>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold text-[var(--text)]">{followersCount}</p>
            <p className="text-xs text-[var(--text-muted)]">Takipci</p>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold text-[var(--text)]">{followingCount}</p>
            <p className="text-xs text-[var(--text-muted)]">Takip</p>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold text-[var(--text)]">{reviewCount}</p>
            <p className="text-xs text-[var(--text-muted)]">Degerlendirme</p>
          </div>
        </div>

        {/* Reputation */}
        <div className="mt-4 p-4 rounded-xl bg-[var(--card)] flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Topluluk Puani</p>
            <p className="text-2xl font-bold" style={{ color: getScoreColor(repScore) }}>
              {repScore.toFixed(1)}
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: getScoreColor(repScore) }}
          >
            {getScoreLabel(repScore)}
          </span>
        </div>

        {/* Relationship Status */}
        {relationshipStatus && relationshipStatus !== "single" && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
            <Users size={14} />
            {relationshipStatus === "in_relationship" && (partnerUsername ? `${partnerUsername} ile sevgili` : "Iliskide")}
            {relationshipStatus === "married" && (partnerUsername ? `${partnerUsername} ile evli` : "Evli")}
            {relationshipStatus === "open_relationship" && (partnerUsername ? `${partnerUsername} ile acik iliski` : "Acik Iliski")}
            {relationshipStatus === "complicated" && "Karmasik"}
            {relationshipStatus === "divorced" && "Bosanmis"}
            {relationshipStatus === "widowed" && "Dul"}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Link
            href="/edit-profile"
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--card)]"
          >
            <Edit3 size={16} />
            Profili Duzenle
          </Link>
          <Link
            href="/edit-dating-profile"
            className="flex-1 py-2.5 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--primary)]/10"
          >
            <Heart size={16} />
            Dating Profili
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-light)] overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium text-center whitespace-nowrap px-2 ${
              tab === key
                ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "posts" && (
        posts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
            <MessageCircle size={48} className="mb-3 opacity-30" />
            <p>Henuz paylasim yok</p>
          </div>
        ) : (
          posts.map((post) => {
            const cat = CATEGORIES[post.category as keyof typeof CATEGORIES];
            return (
              <Link key={post.id} href={`/post/${post.id}`} className="block px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-[var(--text-muted)]">{timeAgo(post.created_at)}</span>
                  {cat && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: cat.color + "20", color: cat.color }}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                  )}
                  {post.is_anonymous && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--text-muted)]/10 text-[var(--text-muted)]">Anonim</span>
                  )}
                </div>
                <p className="text-[var(--text)] whitespace-pre-wrap line-clamp-3">{post.content}</p>
              </Link>
            );
          })
        )
      )}

      {tab === "comments" && (
        userComments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
            <MessageCircle size={48} className="mb-3 opacity-30" />
            <p>Henuz yorum yok</p>
          </div>
        ) : (
          userComments.map((comment) => (
            <Link
              key={comment.id}
              href={`/post/${comment.post_id}`}
              className="block px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[var(--text-muted)]">{timeAgo(comment.created_at)}</span>
                {comment.parent_id && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">Yanit</span>
                )}
              </div>
              <p className="text-[var(--text)] line-clamp-2">{comment.content}</p>
              {comment.posts && (
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
                  Post: {comment.posts.content}
                </p>
              )}
            </Link>
          ))
        )
      )}

      {tab === "reactions" && (
        userReactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
            <Heart size={48} className="mb-3 opacity-30" />
            <p>Henuz tepki yok</p>
          </div>
        ) : (
          userReactions.map((reaction) => {
            const r = REACTIONS[reaction.reaction_type as keyof typeof REACTIONS];
            return (
              <Link
                key={reaction.id}
                href={`/post/${reaction.post_id}`}
                className="block px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{r?.emoji || reaction.reaction_type}</span>
                  <span className="text-xs text-[var(--text-muted)]">{r?.label}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-auto">{timeAgo(reaction.created_at)}</span>
                </div>
                {reaction.posts && (
                  <p className="text-sm text-[var(--text)] line-clamp-2">{reaction.posts.content}</p>
                )}
              </Link>
            );
          })
        )
      )}

      {tab === "reviews" && (
        reviews.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
            <Star size={48} className="mb-3 opacity-30" />
            <p>Henuz degerlendirme yok</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="px-4 py-4 border-b border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {review.is_anonymous ? (
                    <span className="text-sm text-[var(--text-muted)]">Anonim</span>
                  ) : review.reviewer ? (
                    <Link href={`/u/${review.reviewer.username}`} className="text-sm font-medium text-[var(--text)] hover:underline">
                      {review.reviewer.username}
                    </Link>
                  ) : (
                    <span className="text-sm text-[var(--text-muted)]">Kullanici</span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">{timeAgo(review.created_at)}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: getScoreColor(review.score) }}
                >
                  {review.score}/10
                </span>
              </div>
              {(review.positive_tags?.length > 0 || review.negative_tags?.length > 0) && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {review.positive_tags?.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)]">{tag}</span>
                  ))}
                  {review.negative_tags?.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">{tag}</span>
                  ))}
                </div>
              )}
              {review.content && (
                <p className="text-sm text-[var(--text)]">{review.content}</p>
              )}
            </div>
          ))
        )
      )}
    </div>
  );
}
