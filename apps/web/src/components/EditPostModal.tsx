"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Save, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, type PostCategory } from "@entrika/shared";

const CONTENT_MIN_LENGTH = 10;
const CONTENT_MAX_LENGTH = 500;

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  post: {
    id: string;
    content: string;
    category: string;
    is_anonymous: boolean;
    is_spoiler?: boolean;
  } | null;
}

export function EditPostModal({ open, onClose, onSaved, post }: EditPostModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post && open) {
      setContent(post.content);
      setCategory((post.category as PostCategory) || null);
      setIsAnonymous(post.is_anonymous);
      setIsSpoiler(post.is_spoiler ?? false);
    }
  }, [post, open]);

  if (!open || !post) return null;

  const isDirty =
    content !== post.content ||
    category !== post.category ||
    isAnonymous !== post.is_anonymous ||
    isSpoiler !== (post.is_spoiler ?? false);

  const handleSave = async () => {
    if (content.trim().length < CONTENT_MIN_LENGTH) {
      alert(`En az ${CONTENT_MIN_LENGTH} karakter olmali.`);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          content: content.trim(),
          category: category || "general",
          is_anonymous: isAnonymous,
          is_spoiler: isSpoiler,
        })
        .eq("id", post.id);
      if (error) throw error;
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Post guncellenemedi.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu postu silmek istediginize emin misiniz? Bu islem geri alinamaz.")) return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Post silinemedi.";
      alert(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-4 rounded-2xl border border-[var(--border-light)] bg-[var(--background)] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--card)]">
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
          <h2 className="text-lg font-bold text-[var(--text)]">Postu Duzenle</h2>
          <button onClick={handleDelete} className="p-1 rounded-lg hover:bg-red-500/10">
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Icerik</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={CONTENT_MAX_LENGTH}
              rows={5}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none resize-none"
              placeholder="Nelerden bahsetmek istersin?"
            />
            <p className={`text-xs text-right mt-1 ${content.length > CONTENT_MAX_LENGTH * 0.9 ? "text-red-500" : "text-[var(--text-muted)]"}`}>
              {content.length}/{CONTENT_MAX_LENGTH}
            </p>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key as PostCategory)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    category === key
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                      : "border-[var(--border-light)] text-[var(--text-muted)] hover:bg-[var(--card)]"
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Secenekler</label>
            <div className="space-y-2">
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  isAnonymous
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--border-light)] hover:bg-[var(--card)]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isAnonymous ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border-light)]"
                  }`}
                >
                  {isAnonymous && <Check size={14} className="text-white" />}
                </div>
                <span className={`text-sm ${isAnonymous ? "text-[var(--primary)] font-medium" : "text-[var(--text-muted)]"}`}>
                  Anonim paylas
                </span>
              </button>

              <button
                onClick={() => setIsSpoiler(!isSpoiler)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  isSpoiler
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--border-light)] hover:bg-[var(--card)]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSpoiler ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border-light)]"
                  }`}
                >
                  {isSpoiler && <Check size={14} className="text-white" />}
                </div>
                <span className={`text-sm ${isSpoiler ? "text-[var(--primary)] font-medium" : "text-[var(--text-muted)]"}`}>
                  Spoiler icerigi
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-light)]">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold disabled:opacity-40 transition-opacity"
            style={{ background: "var(--primary)" }}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
