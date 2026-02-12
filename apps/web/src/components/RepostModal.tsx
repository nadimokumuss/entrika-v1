"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@entrika/shared";

interface RepostModalProps {
  open: boolean;
  onClose: () => void;
  originalPost: {
    id: string;
    content: string;
    category: string;
    is_anonymous: boolean;
    profiles?: { username: string; avatar_url: string };
  };
  onReposted?: () => void;
}

export function RepostModal({ open, onClose, originalPost, onReposted }: RepostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("itiraf");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("posts").insert({
        content: content.trim(),
        category,
        is_anonymous: isAnonymous,
        is_spoiler: false,
        author_id: user.id,
        repost_of_id: originalPost.id,
      });

      if (insertError) throw insertError;
      onReposted?.();
      onClose();
      setContent("");
    } catch {
      setError("Paylaşım yapılamadı");
    }
    setLoading(false);
  };

  const cat = CATEGORIES[originalPost.category as keyof typeof CATEGORIES];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl bg-[var(--background)] border border-[var(--border-light)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-bold text-[var(--text)]">Alıntıla</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--card)]">
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="px-4 py-2 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">{error}</div>
          )}

          {/* Embedded original post */}
          <div className="p-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)]/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {originalPost.is_anonymous ? "Anonim" : originalPost.profiles?.username || "Kullanıcı"}
              </span>
              {cat && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                  {cat.emoji} {cat.label}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text)] line-clamp-3">{originalPost.content}</p>
          </div>

          {/* User comment */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Yorumunu ekle..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none resize-none"
          />

          {/* Category */}
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-2">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    category === key
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border-light)] text-[var(--text-muted)]"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full relative transition-colors ${isAnonymous ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isAnonymous ? "left-5" : "left-1"}`}
              />
            </div>
            <span className="text-sm text-[var(--text)]">Anonim paylaşım</span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Paylaşılıyor..." : "Alıntıla ve Paylaş"}
          </button>
        </div>
      </div>
    </div>
  );
}
