"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, PenSquare, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, REACTIONS } from "@entrika/shared";
import Link from "next/link";

type FeedTab = "all" | "known" | "unknown";

interface FeedPost {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string };
  reactions: Array<{ reaction_type: string; user_id: string }>;
  comments: Array<{ id: string }>;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(`*, profiles (username, avatar_url), reactions:post_reactions (reaction_type, user_id), comments (id)`)
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data as unknown as FeedPost[]) || []);
    setLoading(false);
  }, []);

  const fetchFollowingIds = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    setFollowingIds((data || []).map((f) => f.following_id));
  }, [user]);

  useEffect(() => {
    fetchPosts();
    fetchFollowingIds();
  }, [fetchPosts, fetchFollowingIds]);

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "known") return followingIds.includes(post.author_id);
    if (activeTab === "unknown") return !followingIds.includes(post.author_id);
    return true;
  });

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    const existing = post?.reactions.find(
      (r) => r.user_id === user.id && r.reaction_type === reactionType
    );

    if (existing) {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("reaction_type", reactionType);
    } else {
      await supabase
        .from("post_reactions")
        .upsert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
    }
    fetchPosts();
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

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-[var(--text)]">Ana Sayfa</h1>
          <button onClick={fetchPosts} className="p-2 rounded-lg hover:bg-[var(--card)]">
            <RefreshCw size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>
        <div className="flex border-b border-[var(--border-light)]">
          {([
            ["all", "Tumu"],
            ["known", "Tanidiklar"],
            ["unknown", "Tanimadiklar"],
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
      </div>

      {/* FAB for mobile */}
      <Link
        href="/new-post"
        className="fixed bottom-20 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white md:hidden"
        style={{ background: "var(--primary)" }}
      >
        <PenSquare size={22} />
      </Link>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          {activeTab === "known" ? "Takip ettigin kisi yok veya henuz paylasim yapilmamis." : "Henuz paylasim yok."}
        </div>
      ) : (
        filteredPosts.map((post) => {
          const cat = CATEGORIES[post.category as keyof typeof CATEGORIES];
          const reactionCounts: Record<string, number> = {};
          post.reactions.forEach((r) => {
            reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          });
          const userReactions = post.reactions.filter((r) => r.user_id === user?.id).map((r) => r.reaction_type);

          return (
            <article key={post.id} className="px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30">
              <div className="flex items-start gap-3">
                <img
                  src={
                    post.is_anonymous
                      ? `https://api.dicebear.com/7.x/lorelei/png?seed=anon-${post.id}`
                      : post.profiles?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${post.author_id}`
                  }
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text)]">
                      {post.is_anonymous ? "Anonim" : post.profiles?.username || "Kullanici"}
                    </span>
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

                  <p className="mt-2 text-[var(--text)] whitespace-pre-wrap">{post.content}</p>

                  {post.image_url && (
                    <img src={post.image_url} alt="" className="mt-3 rounded-xl max-h-96 w-full object-cover" />
                  )}

                  {/* Reactions */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {Object.entries(REACTIONS).map(([key, r]) => {
                      const count = reactionCounts[key] || 0;
                      const isActive = userReactions.includes(key);
                      if (count === 0 && !isActive) return null;

                      return (
                        <button
                          key={key}
                          onClick={() => handleReaction(post.id, key)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                            isActive
                              ? "border-[var(--primary)] bg-[var(--primary)]/10"
                              : "border-[var(--border-light)] hover:bg-[var(--card)]"
                          }`}
                        >
                          <span>{r.emoji}</span>
                          {count > 0 && <span className="text-[var(--text-muted)]">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <Link href={`/post/${post.id}`} className="flex items-center gap-1 mt-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">
                    <MessageCircle size={14} />
                    {post.comments.length > 0 ? `${post.comments.length} yorum` : "Yorum yap"}
                  </Link>
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
