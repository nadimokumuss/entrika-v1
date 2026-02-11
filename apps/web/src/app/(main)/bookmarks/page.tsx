"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bookmarksLib } from "@/lib/shared";
import { CATEGORIES } from "@entrika/shared";
import type { BookmarkWithPost } from "@entrika/shared";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkWithPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const data = await bookmarksLib.getUserBookmarks(user.id);
      setBookmarks(data);
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Yer Imleri</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
          <Bookmark size={48} className="mb-3 opacity-30" />
          <p>Henuz yer imlerine eklenen paylasim yok</p>
        </div>
      ) : (
        bookmarks.map((bm) => {
          const cat = CATEGORIES[bm.posts.category as keyof typeof CATEGORIES];
          return (
            <article key={bm.id} className="px-4 py-4 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-[var(--text)]">
                  {bm.posts.profiles?.username || "Kullanici"}
                </span>
                {cat && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: cat.color + "20", color: cat.color }}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                )}
              </div>
              <p className="text-[var(--text)] whitespace-pre-wrap">{bm.posts.content}</p>
            </article>
          );
        })
      )}
    </div>
  );
}
