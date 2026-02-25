"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { supabase } from "@/lib/supabase";
import { followingLib } from "@/lib/shared";
import { CATEGORIES, REACTIONS } from "@entrika/shared";
import { ArrowLeft, UserPlus, UserMinus, Shield, Star, MoreHorizontal, Flag, Ban, Heart } from "lucide-react";
import Link from "next/link";
import { ReviewModal } from "@/components/ReviewModal";
import { AppModal } from "@/components/AppModal";
import { timeAgo } from "@/lib/utils";

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
  target: { username: string; avatar_url: string } | null;
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

type TabType = "posts" | "comments" | "reactions" | "reviews_received" | "reviews_given";

export default function UserProfileClient({ username }: { username: string }) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollow();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<UserReview[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<UserReview[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [userReactions, setUserReactions] = useState<UserReaction[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null);
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null);

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
        .select("id, score, content, tags, is_anonymous, created_at, target:target_user_id(username, avatar_url)")
        .eq("reviewer_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setPosts(postsResult.data || []);
    setFollowersCount(countsResult.followersCount);
    setFollowingCount(countsResult.followingCount);
    setReviewsReceived((receivedResult.data as unknown as UserReview[]) || []);
    setReviewsGiven((givenResult.data as unknown as UserReview[]) || []);

    // Dating profile (relationship status)
    const { data: datingData } = await supabase
      .from("dating_profiles")
      .select("relationship_status, partner_id")
      .eq("user_id", profileData.id)
      .single();
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
  };

  useEffect(() => {
    loadData();
  }, [username]);

  // Lazy load comments and reactions when tab is selected
  useEffect(() => {
    if (!profile) return;
    if (activeTab === "comments" && userComments.length === 0) loadComments();
    if (activeTab === "reactions" && userReactions.length === 0) loadReactions();
  }, [activeTab, profile]);

  const loadComments = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("comments")
      .select("id, content, is_anonymous, parent_id, created_at, post_id, posts(id, content)")
      .eq("author_id", profile.id)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(50);
    setUserComments((data as unknown as UserComment[]) || []);
  };

  const loadReactions = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("post_reactions")
      .select("id, reaction_type, created_at, post_id, posts(id, content, is_anonymous, author_id, profiles(username))")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setUserReactions((data as unknown as UserReaction[]) || []);
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
        <p className="text-[var(--text-muted)]">Kullanici bulunamadi.</p>
        <Link href="/" className="mt-4 text-[var(--primary)] hover:underline text-sm">
          Ana sayfaya don
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const following = isFollowing(profile.id);

  const tabs: [TabType, string][] = [
    ["posts", "Paylasimlar"],
    ["comments", "Yorumlar"],
    ["reactions", "Tepkiler"],
    ["reviews_received", "Aldigi"],
    ["reviews_given", "Verdigi"],
  ];

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-[var(--card)]" aria-label="Geri dön">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--text)]">{profile.username}</h1>
          <p className="text-xs text-[var(--text-muted)]">{posts.length} paylasim</p>
        </div>
        {!isOwnProfile && user && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-lg hover:bg-[var(--card)]" aria-label="Daha fazla seçenek">
              <MoreHorizontal size={20} className="text-[var(--text-muted)]" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-[var(--border-light)] bg-[var(--background)] shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--card)]"
                >
                  <Flag size={14} />
                  Bildir
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowBlockConfirm(true);
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
                Degerlendir
              </button>
              <button
                onClick={() => {
                  toggleFollow(profile.id);
                  if (following) {
                    setFollowersCount(prev => Math.max(0, prev - 1));
                  } else {
                    setFollowersCount(prev => prev + 1);
                  }
                }}
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

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: getScoreColor(profile.reputation_score) + "15", color: getScoreColor(profile.reputation_score) }}>
            <Shield size={14} />
            {profile.reputation_score.toFixed(1)} puan
          </div>

          {relationshipStatus && relationshipStatus !== "single" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
              {relationshipStatus === "in_relationship" && (partnerUsername ? `${partnerUsername} ile sevgili` : "Iliskide")}
              {relationshipStatus === "married" && (partnerUsername ? `${partnerUsername} ile evli` : "Evli")}
              {relationshipStatus === "open_relationship" && (partnerUsername ? `${partnerUsername} ile acik iliski` : "Acik Iliski")}
              {relationshipStatus === "complicated" && "Karmasik"}
              {relationshipStatus === "divorced" && "Bosanmis"}
              {relationshipStatus === "widowed" && "Dul"}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-light)] overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-sm font-medium relative whitespace-nowrap px-2 ${
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
            <div className="text-center py-12 text-[var(--text-muted)]">Henuz paylasim yok.</div>
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

        {activeTab === "comments" && (
          userComments.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">Henuz yorum yok.</div>
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

        {activeTab === "reactions" && (
          userReactions.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">Henuz tepki yok.</div>
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

        {activeTab === "reviews_received" && (
          reviewsReceived.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">Henuz degerlendirme yok.</div>
          ) : (
            reviewsReceived.map((review) => (
              <div key={review.id} className="px-4 py-4 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold" style={{ color: getScoreColor(review.score) }}>{review.score}/10</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {review.is_anonymous ? "Anonim" : review.reviewer?.username || "Kullanici"}
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
            <div className="text-center py-12 text-[var(--text-muted)]">Henuz degerlendirme yok.</div>
          ) : (
            reviewsGiven.map((review) => (
              <div key={review.id} className="px-4 py-4 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold" style={{ color: getScoreColor(review.score) }}>{review.score}/10</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {review.target?.username || "Kullanici"}
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

      {/* Report Modal */}
      <AppModal
        open={showReportModal}
        type="prompt"
        title="Kullaniciyi Bildir"
        message="Bildirme sebebini secin:"
        options={["Sahte profil", "Taciz/Zorbalik", "Uygunsuz icerik", "Spam", "Diger"]}
        confirmLabel="Gonder"
        onConfirm={async (reason) => {
          setShowReportModal(false);
          if (!reason || !user) return;
          const { error: reportError } = await supabase
            .from("reports")
            .insert({
              reporter_id: user.id,
              report_type: "user",
              target_id: profile.id,
              reason: reason,
            });
          if (reportError) {
            setAlertMsg("Rapor gonderilemedi. Lutfen tekrar deneyin.");
          } else {
            setAlertMsg("Rapor gonderildi. Tesekkurler!");
          }
        }}
        onCancel={() => setShowReportModal(false)}
      />

      {/* Block Confirm Modal */}
      <AppModal
        open={showBlockConfirm}
        type="confirm"
        title="Kullaniciyi Engelle"
        message={`${profile.username} kullanicisini engellemek istediginize emin misiniz?`}
        confirmLabel="Engelle"
        danger
        onConfirm={async () => {
          setShowBlockConfirm(false);
          if (!user) return;
          await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: profile.id });
          setAlertMsg("Kullanici engellendi.");
        }}
        onCancel={() => setShowBlockConfirm(false)}
      />

      {/* Alert Modal */}
      <AppModal
        open={!!alertMsg}
        type="alert"
        title="Bilgi"
        message={alertMsg || ""}
        onConfirm={() => setAlertMsg(null)}
        onCancel={() => setAlertMsg(null)}
      />
    </div>
  );
}
