"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, REACTIONS } from "@entrika/shared";
import { ArrowLeft, Send, MoreHorizontal, Pencil, Trash2, Repeat2, Bookmark, BookmarkCheck, EyeOff, Eye, Reply } from "lucide-react";
import { EditPostModal } from "@/components/EditPostModal";
import { RepostModal } from "@/components/RepostModal";
import { AppModal } from "@/components/AppModal";
import { EmojiPicker } from "@/components/EmojiPicker";
import { bookmarksLib } from "@/lib/shared";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

interface PostDetail {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  is_spoiler?: boolean;
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
  parent_id: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string };
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [postPickerOpen, setPostPickerOpen] = useState(false);
  const [commentReactions, setCommentReactions] = useState<Record<string, Record<string, number>>>({});
  const [userCommentReactions, setUserCommentReactions] = useState<Record<string, string>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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
    const commentsList = (data as unknown as CommentItem[]) || [];
    setComments(commentsList);

    // Fetch comment reactions
    if (commentsList.length > 0) {
      const commentIds = commentsList.map(c => c.id);
      const { data: reactionsData } = await supabase
        .from("comment_reactions")
        .select("comment_id, user_id, reaction_type")
        .in("comment_id", commentIds);

      if (reactionsData) {
        const grouped: Record<string, Record<string, number>> = {};
        const userReacts: Record<string, string> = {};
        reactionsData.forEach((r: { comment_id: string; user_id: string; reaction_type: string }) => {
          if (!grouped[r.comment_id]) grouped[r.comment_id] = {};
          grouped[r.comment_id][r.reaction_type] = (grouped[r.comment_id][r.reaction_type] || 0) + 1;
          if (r.user_id === user?.id) {
            userReacts[r.comment_id] = r.reaction_type;
          }
        });
        setCommentReactions(grouped);
        setUserCommentReactions(userReacts);
      }
    }
  }, [postId, user?.id]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchPost(), fetchComments()]);
      setLoading(false);
    }
    load();
  }, [fetchPost, fetchComments]);

  useEffect(() => {
    async function checkBookmark() {
      if (!user) return;
      const bookmarks = await bookmarksLib.getUserBookmarks(user.id);
      setIsBookmarked(bookmarks.some((b: { post_id: string }) => b.post_id === postId));
    }
    checkBookmark();
  }, [user, postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || sending) return;
    setSending(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      content: newComment.trim(),
      is_anonymous: isAnonymousComment,
      parent_id: replyingTo?.id || null,
    });

    if (!error) {
      setNewComment("");
      setReplyingTo(null);
      fetchComments();
    }
    setSending(false);
  };

  const handleReaction = async (reactionType: string) => {
    if (!user || !post) return;

    // UNIQUE(post_id, user_id) -> bir kullanici bir posta sadece 1 tepki verebilir
    const currentReaction = post.reactions.find((r) => r.user_id === user.id);
    const isSame = currentReaction?.reaction_type === reactionType;

    setPost((prev) => {
      if (!prev) return prev;
      const withoutUser = prev.reactions.filter((r) => r.user_id !== user.id);
      if (isSame) {
        return { ...prev, reactions: withoutUser };
      }
      return { ...prev, reactions: [...withoutUser, { user_id: user.id, reaction_type: reactionType }] };
    });

    if (isSame) {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else if (currentReaction) {
      await supabase
        .from("post_reactions")
        .update({ reaction_type: reactionType })
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("post_reactions")
        .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
    }
  };

  const handleCommentReaction = async (commentId: string, reactionType: string) => {
    if (!user) return;
    const currentReaction = userCommentReactions[commentId];

    // Optimistic update
    setCommentReactions(prev => {
      const updated = { ...prev };
      if (!updated[commentId]) updated[commentId] = {};
      const reactions = { ...updated[commentId] };

      if (currentReaction === reactionType) {
        // Remove
        reactions[reactionType] = Math.max(0, (reactions[reactionType] || 0) - 1);
        if (reactions[reactionType] === 0) delete reactions[reactionType];
      } else {
        // Remove old if exists
        if (currentReaction) {
          reactions[currentReaction] = Math.max(0, (reactions[currentReaction] || 0) - 1);
          if (reactions[currentReaction] === 0) delete reactions[currentReaction];
        }
        // Add new
        reactions[reactionType] = (reactions[reactionType] || 0) + 1;
      }
      updated[commentId] = reactions;
      return updated;
    });

    setUserCommentReactions(prev => {
      const updated = { ...prev };
      if (currentReaction === reactionType) {
        delete updated[commentId];
      } else {
        updated[commentId] = reactionType;
      }
      return updated;
    });

    if (currentReaction === reactionType) {
      await supabase.from("comment_reactions").delete()
        .eq("comment_id", commentId).eq("user_id", user.id);
    } else if (currentReaction) {
      await supabase.from("comment_reactions")
        .update({ reaction_type: reactionType })
        .eq("comment_id", commentId).eq("user_id", user.id);
    } else {
      await supabase.from("comment_reactions")
        .insert({ comment_id: commentId, user_id: user.id, reaction_type: reactionType });
    }

    setOpenPickerId(null);
  };

  const handleDeletePost = () => {
    setShowDeletePostConfirm(true);
  };

  const confirmDeletePost = async () => {
    setShowDeletePostConfirm(false);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Post silinemedi.";
      setAlertMsg(message);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteCommentId(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!user || !deleteCommentId) return;
    const id = deleteCommentId;
    setDeleteCommentId(null);
    const { error } = await supabase.from("comments").delete().eq("id", id).eq("author_id", user.id);
    if (error) {
      setAlertMsg("Yorum silinemedi: " + error.message);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEditComment = async (commentId: string) => {
    if (!user || !editingCommentContent.trim()) return;
    const { error } = await supabase.from("comments").update({ content: editingCommentContent.trim() }).eq("id", commentId).eq("author_id", user.id);
    if (error) {
      setAlertMsg("Yorum guncellenemedi: " + error.message);
      return;
    }
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content: editingCommentContent.trim() } : c));
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleBookmark = async () => {
    if (!user) return;
    if (isBookmarked) {
      await bookmarksLib.removeBookmark(user.id, postId);
      setIsBookmarked(false);
    } else {
      await bookmarksLib.addBookmark(user.id, postId);
      setIsBookmarked(true);
    }
  };

  const handleReply = (comment: CommentItem) => {
    setReplyingTo(comment);
    const displayName = comment.is_anonymous ? "Anonim" : comment.profiles?.username;
    setNewComment(`@${displayName} `);
    inputRef.current?.focus();
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
  const isOwner = post.author_id === user?.id;

  // Group comments: top-level and replies
  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const renderComment = (comment: CommentItem, isReply = false) => {
    const isCommentOwner = comment.author_id === user?.id;
    const isEditing = editingCommentId === comment.id;
    const reactions = commentReactions[comment.id] || {};
    const userReaction = userCommentReactions[comment.id];
    const replies = isReply ? [] : getReplies(comment.id);
    const parentComment = comment.parent_id ? comments.find(c => c.id === comment.parent_id) : null;

    return (
      <div key={comment.id}>
        <div className={`flex items-start gap-3 py-3 border-b border-[var(--border-light)] ${isReply ? "ml-10" : ""}`}>
          {comment.is_anonymous ? (
            <img
              src={`https://api.dicebear.com/7.x/lorelei/png?seed=anon-${comment.id}`}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <Link href={`/u/${comment.profiles?.username}`}>
              <img
                src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${comment.author_id}`}
                alt=""
                className="w-8 h-8 rounded-full object-cover hover:opacity-80"
              />
            </Link>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {comment.is_anonymous ? (
                <span className="font-semibold text-sm text-[var(--text)]">Anonim</span>
              ) : (
                <Link href={`/u/${comment.profiles?.username}`} className="font-semibold text-sm text-[var(--text)] hover:underline">
                  {comment.profiles?.username || "Kullanici"}
                </Link>
              )}
              <span className="text-xs text-[var(--text-muted)]">{timeAgo(comment.created_at)}</span>

              {isCommentOwner && !isEditing && (
                <div className="ml-auto relative">
                  <button
                    onClick={() => setCommentMenuId(commentMenuId === comment.id ? null : comment.id)}
                    className="p-0.5 rounded hover:bg-[var(--card)]"
                    aria-label="Yorum menüsü"
                  >
                    <MoreHorizontal size={14} className="text-[var(--text-muted)]" />
                  </button>
                  {commentMenuId === comment.id && (
                    <div className="absolute right-0 top-6 z-20 w-32 rounded-xl border border-[var(--border-light)] bg-[var(--background)] shadow-lg overflow-hidden">
                      <button
                        onClick={() => {
                          setCommentMenuId(null);
                          setEditingCommentId(comment.id);
                          setEditingCommentContent(comment.content);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--card)]"
                      >
                        <Pencil size={12} /> Duzenle
                      </button>
                      <button
                        onClick={() => { setCommentMenuId(null); handleDeleteComment(comment.id); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-500/5"
                      >
                        <Trash2 size={12} /> Sil
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reply indicator */}
            {isReply && parentComment && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                ↳ @{parentComment.is_anonymous ? "Anonim" : parentComment.profiles?.username}'e yanit
              </p>
            )}

            {isEditing ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={editingCommentContent}
                  onChange={(e) => setEditingCommentContent(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--card)] text-sm text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleEditComment(comment.id)}
                />
                <button
                  onClick={() => handleEditComment(comment.id)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white font-medium"
                  style={{ background: "var(--primary)" }}
                >
                  Kaydet
                </button>
                <button
                  onClick={() => { setEditingCommentId(null); setEditingCommentContent(""); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)]"
                >
                  Iptal
                </button>
              </div>
            ) : (
              <p className="mt-1 text-sm text-[var(--text)]">{comment.content}</p>
            )}

            {/* Comment reactions + reply button */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {Object.entries(reactions).map(([key, count]) => {
                  const r = REACTIONS[key as keyof typeof REACTIONS];
                  if (!r) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => handleCommentReaction(comment.id, key)}
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-transform active:scale-110 ${
                        userReaction === key
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
                  onSelect={(key) => handleCommentReaction(comment.id, key)}
                  activeReactions={userReaction ? [userReaction] : []}
                  isOpen={openPickerId === comment.id}
                  onToggle={() => setOpenPickerId(openPickerId === comment.id ? null : comment.id)}
                />

                <button
                  onClick={() => handleReply(comment)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--card)] transition-colors"
                >
                  <Reply size={12} />
                  Yanitla
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Render replies */}
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-[var(--card)]" aria-label="Geri dön">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text)] flex-1">Paylasim</h1>
        <div className="flex items-center gap-1">
          <button onClick={handleBookmark} className="p-1.5 rounded-lg hover:bg-[var(--card)]" title={isBookmarked ? "Yer iminden kaldir" : "Yer imlerine ekle"} aria-label={isBookmarked ? "Yer iminden kaldir" : "Yer imlerine ekle"}>
            {isBookmarked ? <BookmarkCheck size={18} className="text-[var(--primary)]" /> : <Bookmark size={18} className="text-[var(--text-muted)]" />}
          </button>
          <button onClick={() => setRepostModalOpen(true)} className="p-1.5 rounded-lg hover:bg-[var(--card)]" title="Alintila" aria-label="Alintila">
            <Repeat2 size={18} className="text-[var(--text-muted)]" />
          </button>
          {isOwner && (
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg hover:bg-[var(--card)]" aria-label="Post menüsü">
                <MoreHorizontal size={20} className="text-[var(--text-muted)]" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-[var(--border-light)] bg-[var(--background)] shadow-lg overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); setEditModalOpen(true); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--card)] transition-colors"
                  >
                    <Pencil size={14} />
                    Duzenle
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); handleDeletePost(); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                  >
                    <Trash2 size={14} />
                    Sil
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Post */}
        <div className="px-4 py-4 border-b border-[var(--border-light)]">
          <div className="flex items-start gap-3">
            {post.is_anonymous ? (
              <img
                src={`https://api.dicebear.com/7.x/lorelei/png?seed=anon-${post.id}`}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <Link href={`/u/${post.profiles?.username}`}>
                <img
                  src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${post.author_id}`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover hover:opacity-80"
                />
              </Link>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {post.is_anonymous ? (
                  <span className="font-semibold text-[var(--text)]">Anonim</span>
                ) : (
                  <Link href={`/u/${post.profiles?.username}`} className="font-semibold text-[var(--text)] hover:underline">
                    {post.profiles?.username || "Kullanici"}
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
              </div>
              <p className="mt-3 text-[var(--text)] whitespace-pre-wrap text-base">{post.content}</p>
              {post.image_url && (
                <img src={post.image_url} alt="" className="mt-3 rounded-xl max-h-96 w-full object-cover" />
              )}

              {/* Reactions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-4">
                {Object.entries(REACTIONS).map(([key, r]) => {
                  const count = reactionCounts[key] || 0;
                  const isActive = userReactions.includes(key);
                  if (count === 0 && !isActive) return null;

                  return (
                    <button
                      key={key}
                      onClick={() => handleReaction(key)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border transition-transform active:scale-110 ${
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
                  onSelect={(key) => handleReaction(key)}
                  activeReactions={userReactions}
                  isOpen={postPickerOpen}
                  onToggle={() => setPostPickerOpen(!postPickerOpen)}
                />
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
            topLevelComments.map((comment) => renderComment(comment))
          )}
        </div>
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[var(--card)] border-t border-[var(--border-light)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            ↳ {replyingTo.is_anonymous ? "Anonim" : replyingTo.profiles?.username}'e yanit yaziyorsun
          </p>
          <button onClick={() => { setReplyingTo(null); setNewComment(""); }} className="text-xs text-[var(--primary)]">
            Iptal
          </button>
        </div>
      )}

      {/* Comment Input */}
      <div className="border-t border-[var(--border-light)] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnonymousComment(!isAnonymousComment)}
            className={`p-2 rounded-lg transition-colors ${isAnonymousComment ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--text-muted)] hover:bg-[var(--card)]"}`}
            title={isAnonymousComment ? "Anonim yorum (acik)" : "Anonim yorum (kapali)"}
            aria-label={isAnonymousComment ? "Anonim yorum acik" : "Anonim yorum kapali"}
          >
            {isAnonymousComment ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            placeholder={replyingTo ? `${replyingTo.is_anonymous ? "Anonim" : replyingTo.profiles?.username}'e yanit yaz...` : "Yorum yaz..."}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || sending}
            className="p-2.5 rounded-xl text-white disabled:opacity-40"
            style={{ background: "var(--primary)" }}
            aria-label="Yorum gönder"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={fetchPost}
        post={post}
      />

      {/* Repost Modal */}
      <RepostModal
        open={repostModalOpen}
        onClose={() => setRepostModalOpen(false)}
        originalPost={post}
        onReposted={() => router.push("/")}
      />

      {/* Delete Post Confirm */}
      <AppModal
        open={showDeletePostConfirm}
        type="confirm"
        title="Postu Sil"
        message="Bu postu silmek istediginize emin misiniz? Bu islem geri alinamaz."
        confirmLabel="Sil"
        danger
        onConfirm={confirmDeletePost}
        onCancel={() => setShowDeletePostConfirm(false)}
      />

      {/* Delete Comment Confirm */}
      <AppModal
        open={!!deleteCommentId}
        type="confirm"
        title="Yorumu Sil"
        message="Bu yorumu silmek istediginize emin misiniz?"
        confirmLabel="Sil"
        danger
        onConfirm={confirmDeleteComment}
        onCancel={() => setDeleteCommentId(null)}
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
