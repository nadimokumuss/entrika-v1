"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bookmarksLib } from "@/lib/shared";
import { CATEGORIES } from "@entrika/shared";
import type { BookmarkWithPost } from "@entrika/shared";
import { Bookmark, BookmarkX, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkWithPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    if (!user) return;
    const data = await bookmarksLib.getUserBookmarks(user.id);
    setBookmarks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBookmarks();
  }, [user]);

  const removeBookmark = async (postId: string) => {
    if (!user) return;
    await bookmarksLib.removeBookmark(user.id, postId);
    setBookmarks((prev) => prev.filter((b) => b.posts.id !== postId));
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
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Yer İmleri</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
          <Bookmark size={48} className="mb-3 opacity-30" />
          <p>Henüz yer imlerine eklenen paylaşım yok</p>
        </div>
      ) : (
        bookmarks.map((bm) => {
          const cat = CATEGORIES[bm.posts.category as keyof typeof CATEGORIES];
          return (
            <article key={bm.id} className="px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30">
              <div className="flex items-center gap-2 mb-2">
                {bm.posts.profiles?.username ? (
                  <Link href={`/u/${bm.posts.profiles.username}`} className="font-semibold text-sm text-[var(--text)] hover:underline">
                    {bm.posts.profiles.username}
                  </Link>
                ) : (
                  <span className="font-semibold text-sm text-[var(--text)]">Kullanıcı</span>
                )}
                <span className="text-xs text-[var(--text-muted)]">{timeAgo(bm.posts.created_at)}</span>
                {cat && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: cat.color + "20", color: cat.color }}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                )}
                <button
                  onClick={() => removeBookmark(bm.posts.id)}
                  className="ml-auto p-1 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--text-muted)] hover:text-[var(--danger)]"
                  title="Yer iminden kaldır"
                >
                  <BookmarkX size={16} />
                </button>
              </div>
              <Link href={`/post/${bm.posts.id}`} className="block">
                <p className="text-[var(--text)] whitespace-pre-wrap hover:text-[var(--text)]/80">{bm.posts.content}</p>
              </Link>
              <Link href={`/post/${bm.posts.id}`} className="flex items-center gap-1 mt-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">
                <MessageCircle size={14} />
                Yorumlara git
              </Link>
            </article>
          );
        })
      )}
    </div>
  );
}
