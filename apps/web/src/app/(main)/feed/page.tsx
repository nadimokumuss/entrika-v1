"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, PenSquare, MessageCircle, MoreHorizontal, Pencil, Trash2, Bookmark, BookmarkCheck, Repeat2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { bookmarksLib } from "@/lib/shared";
import { CATEGORIES, REACTIONS } from "@entrika/shared";
import { EditPostModal } from "@/components/EditPostModal";
import { RepostModal } from "@/components/RepostModal";
import { AppModal } from "@/components/AppModal";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmojiPicker } from "@/components/EmojiPicker";

type FeedTab = "all" | "known" | "unknown";

interface FeedPost {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  is_spoiler?: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  repost_of_id?: string | null;
  repost_of?: {
    id: string;
    content: string;
    category: string;
    is_anonymous: boolean;
    author_id: string;
    profiles: { username: string; avatar_url: string };
  } | null;
  profiles: { username: string; avatar_url: string };
  reactions: Array<{ reaction_type: string; user_id: string }>;
  comments: Array<{ id: string }>;
}

function PostMenu({ post, onEdit, onDelete }: { post: FeedPost; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded-lg hover:bg-[var(--card)]" aria-label="Post menüsü">
        <MoreHorizontal size={16} className="text-[var(--text-muted)]" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-[var(--border-light)] bg-[var(--background)] shadow-lg overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--card)] transition-colors"
          >
            <Pencil size={14} />
            Düzenle
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
          >
            <Trash2 size={14} />
            Sil
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);
  const [repostingPost, setRepostingPost] = useState<FeedPost | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(`*, profiles (username, avatar_url), reactions:post_reactions (reaction_type, user_id), comments (id), repost_of:repost_of_id(id, content, category, is_anonymous, author_id, profiles(username, avatar_url))`)
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

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    const data = await bookmarksLib.getUserBookmarks(user.id);
    setBookmarkedIds(new Set(data.map((b: { post_id: string }) => b.post_id)));
  }, [user]);

  useEffect(() => {
    fetchPosts();
    fetchFollowingIds();
    fetchBookmarks();
  }, [fetchPosts, fetchFollowingIds, fetchBookmarks]);

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "known") return followingIds.includes(post.author_id);
    if (activeTab === "unknown") return !followingIds.includes(post.author_id);
    return true;
  }).filter((post) => {
    if (categoryFilter) return post.category === categoryFilter;
    return true;
  });

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // UNIQUE(post_id, user_id) -> bir kullanici bir posta sadece 1 tepki verebilir
    const currentReaction = post.reactions.find((r) => r.user_id === user.id);
    const isSame = currentReaction?.reaction_type === reactionType;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const withoutUser = p.reactions.filter((r) => r.user_id !== user.id);
        if (isSame) {
          // Ayni tepkiye tekrar tikladi -> kaldir
          return { ...p, reactions: withoutUser };
        } else {
          // Yeni tepki veya farkli tepki -> degistir
          return { ...p, reactions: [...withoutUser, { user_id: user.id, reaction_type: reactionType }] };
        }
      })
    );

    // Animate
    setAnimatingReaction(`${postId}-${reactionType}`);
    setTimeout(() => setAnimatingReaction(null), 300);

    let result;
    if (isSame) {
      result = await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else if (currentReaction) {
      result = await supabase
        .from("post_reactions")
        .update({ reaction_type: reactionType })
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      result = await supabase
        .from("post_reactions")
        .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
    }
    if (result.error) console.error("REACTION ERROR:", result.error);
  };

  const handleDeletePost = (postId: string) => {
    setDeletePostId(postId);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    const id = deletePostId;
    setDeletePostId(null);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
      fetchPosts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Post silinemedi.";
      setAlertMsg(message);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedIds.has(postId);
    if (isBookmarked) {
      await bookmarksLib.removeBookmark(user.id, postId);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      await bookmarksLib.addBookmark(user.id, postId);
      setBookmarkedIds((prev) => new Set(prev).add(postId));
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "az önce";
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
          <h1 className="text-xl font-bold text-[var(--text)]">
            {categoryFilter
              ? `${CATEGORIES[categoryFilter as keyof typeof CATEGORIES]?.emoji || ""} ${CATEGORIES[categoryFilter as keyof typeof CATEGORIES]?.label || categoryFilter}`
              : "Ana Sayfa"}
          </h1>
          <div className="flex items-center gap-2">
            {categoryFilter && (
              <Link href="/feed" className="text-sm text-[var(--primary)] hover:underline">
                Tümü
              </Link>
            )}
            <button onClick={fetchPosts} className="p-2 rounded-lg hover:bg-[var(--card)]" aria-label="Yenile">
              <RefreshCw size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>
        <div className="flex border-b border-[var(--border-light)]">
          {([
            ["all", "Tümü"],
            ["known", "Tanıdıklar"],
            ["unknown", "Tanımadıklar"],
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
        aria-label="Yeni paylaşım"
        style={{ background: "var(--primary)" }}
      >
        <PenSquare size={22} aria-hidden="true" />
      </Link>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          {categoryFilter
            ? "Bu kategoride henüz paylaşım yok."
            : activeTab === "known"
              ? "Takip ettiğin kişi yok veya henüz paylaşım yapılmamış."
              : "Henüz paylaşım yok."}
        </div>
      ) : (
        filteredPosts.map((post) => {
          const cat = CATEGORIES[post.category as keyof typeof CATEGORIES];
          const reactionCounts: Record<string, number> = {};
          post.reactions.forEach((r) => {
            reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          });
          const userReactions = post.reactions.filter((r) => r.user_id === user?.id).map((r) => r.reaction_type);
          const isOwner = post.author_id === user?.id;
          const isBookmarked = bookmarkedIds.has(post.id);

          return (
            <article key={post.id} className="px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30">
              <div className="flex items-start gap-3">
                {/* Avatar - clickable if not anonymous */}
                {post.is_anonymous ? (
                  <img
                    src={`https://api.dicebear.com/7.x/lorelei/png?seed=anon-${post.id}`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <Link href={`/u/${post.profiles?.username}`}>
                    <img
                      src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${post.author_id}`}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0 hover:opacity-80 transition-opacity"
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.is_anonymous ? (
                      <span className="font-semibold text-[var(--text)]">Anonim</span>
                    ) : (
                      <Link href={`/u/${post.profiles?.username}`} className="font-semibold text-[var(--text)] hover:underline">
                        {post.profiles?.username || "Kullanıcı"}
                      </Link>
                    )}
                    <span className="text-sm text-[var(--text-muted)]">{timeAgo(post.created_at)}</span>
                    {cat && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: cat.color + "20", color: cat.color }}
                      >
                        {cat.emoji} {cat.label}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => setRepostingPost(post)}
                        className="p-1 rounded-lg hover:bg-[var(--card)] transition-colors"
                        title="Alıntıla"
                      >
                        <Repeat2 size={16} className="text-[var(--text-muted)]" />
                      </button>
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className="p-1 rounded-lg hover:bg-[var(--card)] transition-colors"
                        title={isBookmarked ? "Yer iminden kaldır" : "Yer imlerine ekle"}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck size={16} className="text-[var(--primary)]" />
                        ) : (
                          <Bookmark size={16} className="text-[var(--text-muted)]" />
                        )}
                      </button>
                      {isOwner && (
                        <PostMenu
                          post={post}
                          onEdit={() => setEditingPost(post)}
                          onDelete={() => handleDeletePost(post.id)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Post content - clickable */}
                  <Link href={`/post/${post.id}`} className="block mt-2">
                    <p className="text-[var(--text)] whitespace-pre-wrap hover:text-[var(--text)]/80">{post.content}</p>
                  </Link>

                  {post.image_url && (
                    <Link href={`/post/${post.id}`}>
                      <img src={post.image_url} alt="" className="mt-3 rounded-xl max-h-96 w-full object-cover" />
                    </Link>
                  )}

                  {/* Repost embed */}
                  {post.repost_of && (
                    <Link href={`/post/${post.repost_of.id}`} className="block mt-3 p-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)]/50 hover:bg-[var(--card)]">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={post.repost_of.is_anonymous
                            ? `https://api.dicebear.com/7.x/lorelei/png?seed=anon-${post.repost_of.id}`
                            : post.repost_of.profiles?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${post.repost_of.author_id}`}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {post.repost_of.is_anonymous ? "Anonim" : post.repost_of.profiles?.username}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text)] line-clamp-3">{post.repost_of.content}</p>
                    </Link>
                  )}

                  {/* Reactions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {Object.entries(REACTIONS).map(([key, r]) => {
                      const count = reactionCounts[key] || 0;
                      const isActive = userReactions.includes(key);
                      if (count === 0 && !isActive) return null;

                      return (
                        <button
                          key={key}
                          onClick={() => handleReaction(post.id, key)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-transform ${
                            animatingReaction === `${post.id}-${key}` ? "scale-125" : "scale-100"
                          } ${
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

                    <EmojiPicker
                      onSelect={(key) => handleReaction(post.id, key)}
                      activeReactions={userReactions}
                      isOpen={openPickerId === post.id}
                      onToggle={() => setOpenPickerId(openPickerId === post.id ? null : post.id)}
                    />
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

      {/* Edit Post Modal */}
      <EditPostModal
        open={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSaved={fetchPosts}
        post={editingPost}
      />

      {/* Repost Modal */}
      {repostingPost && (
        <RepostModal
          open={!!repostingPost}
          onClose={() => setRepostingPost(null)}
          originalPost={{
            id: repostingPost.id,
            content: repostingPost.content,
            category: repostingPost.category,
            is_anonymous: repostingPost.is_anonymous,
            profiles: repostingPost.profiles,
          }}
          onReposted={fetchPosts}
        />
      )}

      {/* Delete Confirm Modal */}
      <AppModal
        open={!!deletePostId}
        type="confirm"
        title="Postu Sil"
        message="Bu postu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onConfirm={confirmDeletePost}
        onCancel={() => setDeletePostId(null)}
      />

      {/* Alert Modal */}
      <AppModal
        open={!!alertMsg}
        type="alert"
        title="Hata"
        message={alertMsg || ""}
        onConfirm={() => setAlertMsg(null)}
        onCancel={() => setAlertMsg(null)}
      />
    </div>
  );
}
