"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { supabase } from "@/lib/supabase";
import { followingLib } from "@/lib/shared";
import { CATEGORIES } from "@entrika/shared";
import { ArrowLeft, UserPlus, UserMinus, Shield, Star, MoreHorizontal, Flag, Ban } from "lucide-react";
import Link from "next/link";
import { ReviewModal } from "@/components/ReviewModal";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
  full_name: string | null;
  city: string | null;
  occupation: string | null;
  reputation_score: number;
  gender: string;
  created_at: string;
}

interface UserPost {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  created_at: string;
}

interface UserReview {
  id: string;
  score: number;
  content: string | null;
  tags: string[];
  is_anonymous: boolean;
  created_at: string;
  reviewer: { username: string; avatar_url: string } | null;
}

type TabType = "posts" | "reviews_received" | "reviews_given";

export default function UserProfileClient({ username }: { username: string }) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollow();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<UserReview[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<UserReview[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const loadData = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const [postsResult, countsResult, receivedResult, givenResult] = await Promise.all([
      supabase
        .from("posts")
        .select("id, content, category, is_anonymous, created_at")
        .eq("author_id", profileData.id)
        .eq("is_anonymous", false)
        .order("created_at", { ascending: false })
        .limit(20),
      followingLib.getFollowCounts(profileData.id),
      supabase
        .from("user_reviews")
        .select("id, score, content, tags, is_anonymous, created_at, reviewer:reviewer_id(username, avatar_url)")
        .eq("target_user_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_reviews")
        .select("id, score, content, tags, is_anonymous, created_at, reviewer:target_user_id(username, avatar_url)")
        .eq("reviewer_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setPosts(postsResult.data || []);
    setFollowersCount(countsResult.followersCount);
    setFollowingCount(countsResult.followingCount);
    setReviewsReceived((receivedResult.data as unknown as UserReview[]) || []);
    setReviewsGiven((givenResult.data as unknown as UserReview[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [username]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "az önce";
    if (mins < 60) return `${mins}dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa`;
    return `${Math.floor(hours / 24)}g`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "var(--success)";
    if (score >= 5) return "var(--primary)";
    if (score >= 3) return "#F59E0B";
    return "var(--danger)";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">Kullanıcı bulunamadı.</p>
        <Link href="/" className="mt-4 text-[var(--primary)] hover:underline text-sm">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const following = isFollowing(profile.id);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-[var(--card)]">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--text)]">{profile.username}</h1>
          <p className="text-xs text-[var(--text-muted)]">{posts.length} paylaşım</p>
        </div>
        {!isOwnProfile && user && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-lg hover:bg-[var(--card)]">
              <MoreHorizontal size={20} className="text-[var(--text-muted)]" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-[var(--border-light)] bg-[var(--background)] shadow-lg overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--card)]"
                >
                  <Flag size={14} />
                  Bildir
                </button>
                <button
                  onClick={async () => {
                    setShowMenu(false);
                    if (window.confirm(`${profile.username} kullanıcısını engellemek istediğinize emin misiniz?`)) {
                      await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: profile.id });
                      alert("Kullanıcı engellendi");
                    }
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/5"
                >
                  <Ban size={14} />
                  Engelle
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-start justify-between">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${profile.id}`}
            alt={profile.username}
            className="w-20 h-20 rounded-full object-cover"
          />
          {!isOwnProfile && user && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              >
                <Star size={16} />
                Değerlendir
              </button>
              <button
                onClick={() => toggleFollow(profile.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${
                  following
                    ? "bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
                    : "text-white"
                }`}
                style={!following ? { background: "var(--primary)" } : undefined}
              >
                {following ? <><UserMinus size={16} /> Takipte</> : <><UserPlus size={16} /> Takip Et</>}
              </button>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-[var(--text)] mt-3">{profile.full_name || profile.username}</h2>
        <p className="text-sm text-[var(--text-muted)]">@{profile.username}</p>
        {profile.bio && <p className="text-sm text-[var(--text)] mt-2">{profile.bio}</p>}
        {(profile.city || profile.occupation) && (
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {[profile.occupation, profile.city].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="flex gap-4 mt-3">
          <span className="text-sm"><strong className="text-[var(--text)]">{followersCount}</strong> <span className="text-[var(--text-muted)]">takipci</span></span>
          <span className="text-sm"><strong className="text-[var(--text)]">{followingCount}</strong> <span className="text-[var(--text-muted)]">takip</span></span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: getScoreColor(profile.reputation_score) + "15", color: getScoreColor(profile.reputation_score) }}>
          <Shield size={14} />
          {profile.reputation_score.toFixed(1)} puan
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-light)]">
        {([
          ["posts", "Paylaşımlar"],
          ["reviews_received", "Aldığı Değerlendirmeler"],
          ["reviews_given", "Verdiği Değerlendirmeler"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === key ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {label}
            {activeTab === key && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-full bg-[var(--primary)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "posts" && (
          posts.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">Henüz paylaşım yok.</div>
          ) : (
            posts.map((post) => {
              const cat = CATEGORIES[post.category as keyof typeof CATEGORIES];
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[var(--text-muted)]">{timeAgo(post.created_at)}</span>
                    {cat && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: cat.color + "20", color: cat.color }}
                      >
                        {cat.emoji} {cat.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text)] line-clamp-3">{post.content}</p>
                </Link>
              );
            })
          )
        )}

        {activeTab === "reviews_received" && (
          reviewsReceived.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">Henüz değerlendirme yok.</div>
          ) : (
            reviewsReceived.map((review) => (
              <div key={review.id} className="px-4 py-4 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold" style={{ color: getScoreColor(review.score) }}>{review.score}/10</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {review.is_anonymous ? "Anonim" : review.reviewer?.username || "Kullanıcı"}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{timeAgo(review.created_at)}</span>
                </div>
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {review.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-[var(--card)] text-[var(--text-muted)]">{tag}</span>
                    ))}
                  </div>
                )}
                {review.content && <p className="text-sm text-[var(--text)]">{review.content}</p>}
              </div>
            ))
          )
        )}

        {activeTab === "reviews_given" && (
          reviewsGiven.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">Henüz değerlendirme yok.</div>
          ) : (
            reviewsGiven.map((review) => (
              <div key={review.id} className="px-4 py-4 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold" style={{ color: getScoreColor(review.score) }}>{review.score}/10</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {review.reviewer?.username || "Kullanıcı"}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{timeAgo(review.created_at)}</span>
                </div>
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {review.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-[var(--card)] text-[var(--text-muted)]">{tag}</span>
                    ))}
                  </div>
                )}
                {review.content && <p className="text-sm text-[var(--text)]">{review.content}</p>}
              </div>
            ))
          )
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        targetUserId={profile.id}
        targetUsername={profile.username}
        onReviewSubmitted={loadData}
      />
    </div>
  );
}
