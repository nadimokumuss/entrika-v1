"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, REACTIONS } from "@entrika/shared";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface PostDetail {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string };
  reactions: Array<{ reaction_type: string; user_id: string }>;
}

interface CommentItem {
  id: string;
  content: string;
  is_anonymous: boolean;
  author_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string };
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchPost = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select(`*, profiles (username, avatar_url), reactions:post_reactions (reaction_type, user_id)`)
      .eq("id", postId)
      .single();
    setPost(data as unknown as PostDetail);
  }, [postId]);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles (username, avatar_url)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((data as unknown as CommentItem[]) || []);
  }, [postId]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchPost(), fetchComments()]);
      setLoading(false);
    }
    load();
  }, [fetchPost, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || sending) return;
    setSending(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      content: newComment.trim(),
      is_anonymous: false,
    });

    if (!error) {
      setNewComment("");
      fetchComments();
    }
    setSending(false);
  };

  const handleReaction = async (reactionType: string) => {
    if (!user || !post) return;
    const existing = post.reactions.find(
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
    fetchPost();
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        Paylasim bulunamadi.
      </div>
    );
  }

  const cat = CATEGORIES[post.category as keyof typeof CATEGORIES];
  const reactionCounts: Record<string, number> = {};
  post.reactions.forEach((r) => {
    reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
  });
  const userReactions = post.reactions
    .filter((r) => r.user_id === user?.id)
    .map((r) => r.reaction_type);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-[var(--card)]">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text)]">Paylasim</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Post */}
        <div className="px-4 py-4 border-b border-[var(--border-light)]">
          <div className="flex items-start gap-3">
            <img
              src={
                post.is_anonymous
                  ? `https://api.dicebear.com/7.x/lorelei/png?seed=anon-${post.id}`
                  : post.profiles?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${post.author_id}`
              }
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
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
              <p className="mt-3 text-[var(--text)] whitespace-pre-wrap text-base">{post.content}</p>
              {post.image_url && (
                <img src={post.image_url} alt="" className="mt-3 rounded-xl max-h-96 w-full object-cover" />
              )}

              {/* Reactions */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {Object.entries(REACTIONS).map(([key, r]) => {
                  const count = reactionCounts[key] || 0;
                  const isActive = userReactions.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => handleReaction(key)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border ${
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
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="px-4 py-2">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-3">
            Yorumlar ({comments.length})
          </h2>
          {comments.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              Henuz yorum yok. Ilk yorumu sen yap!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 py-3 border-b border-[var(--border-light)]">
                <img
                  src={
                    comment.is_anonymous
                      ? `https://api.dicebear.com/7.x/lorelei/png?seed=anon-${comment.id}`
                      : comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${comment.author_id}`
                  }
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--text)]">
                      {comment.is_anonymous ? "Anonim" : comment.profiles?.username || "Kullanici"}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text)]">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="border-t border-[var(--border-light)] px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            placeholder="Yorum yaz..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || sending}
            className="p-2.5 rounded-xl text-white disabled:opacity-40"
            style={{ background: "var(--primary)" }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
