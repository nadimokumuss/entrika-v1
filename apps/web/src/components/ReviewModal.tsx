"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const SCORE_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "Çok Kötü", emoji: "💀", color: "#EF4444" },
  2: { label: "Kötü", emoji: "😡", color: "#F97316" },
  3: { label: "Zayıf", emoji: "😤", color: "#F59E0B" },
  4: { label: "Ortalama Altı", emoji: "😕", color: "#EAB308" },
  5: { label: "Ortalama", emoji: "😐", color: "#84CC16" },
  6: { label: "Ortalama Üstü", emoji: "🙂", color: "#22C55E" },
  7: { label: "İyi", emoji: "😊", color: "#10B981" },
  8: { label: "Çok İyi", emoji: "😄", color: "#14B8A6" },
  9: { label: "Harika", emoji: "🤩", color: "#06B6D4" },
  10: { label: "Mükemmel", emoji: "👑", color: "#8B5CF6" },
};

const POSITIVE_TAGS = [
  "Güvenilir", "Dürüst", "Eğlenceli", "Saygılı", "İlgili",
  "Olgun", "Zeki", "Karizmatik", "Sempatik", "Sadık",
];

const NEGATIVE_TAGS = [
  "Yalancı", "Manipülatif", "İlgisiz", "Saygısız", "Bencil",
  "Toksik", "Güvenilmez", "İkiyüzlü", "Aldatıcı",
];

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUsername: string;
  onReviewSubmitted?: () => void;
}

export function ReviewModal({ open, onClose, targetUserId, targetUsername, onReviewSubmitted }: ReviewModalProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const { error: upsertError } = await supabase
        .from("user_reviews")
        .upsert({
          target_user_id: targetUserId,
          reviewer_id: user.id,
          score,
          tags: selectedTags,
          content: content.trim() || null,
          is_anonymous: isAnonymous,
        }, { onConflict: "target_user_id,reviewer_id" });

      if (upsertError) throw upsertError;

      onReviewSubmitted?.();
      onClose();
    } catch {
      setError("Değerlendirme gönderilemedi");
    }
    setLoading(false);
  };

  const scoreInfo = SCORE_LABELS[score];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--background)] border border-[var(--border-light)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-bold text-[var(--text)]">
            {targetUsername} Değerlendir
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--card)]" aria-label="Kapat">
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {error && (
            <div className="px-4 py-2 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">{error}</div>
          )}

          {/* Score */}
          <div>
            <p className="text-sm font-medium text-[var(--text)] mb-2">Puan</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{scoreInfo.emoji}</span>
              <div>
                <p className="text-2xl font-bold" style={{ color: scoreInfo.color }}>{score}/10</p>
                <p className="text-sm text-[var(--text-muted)]">{scoreInfo.label}</p>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>

          {/* Positive tags */}
          <div>
            <p className="text-sm font-medium text-[var(--text)] mb-2">Pozitif Etiketler</p>
            <div className="flex flex-wrap gap-2">
              {POSITIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    selectedTags.includes(tag)
                      ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                      : "border-[var(--border-light)] text-[var(--text-muted)] hover:border-[var(--success)]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Negative tags */}
          <div>
            <p className="text-sm font-medium text-[var(--text)] mb-2">Negatif Etiketler</p>
            <div className="flex flex-wrap gap-2">
              {NEGATIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    selectedTags.includes(tag)
                      ? "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
                      : "border-[var(--border-light)] text-[var(--text-muted)] hover:border-[var(--danger)]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm font-medium text-[var(--text)] mb-2">Yorum (opsiyonel)</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="Deneyimini paylaşabilirsin..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none resize-none"
            />
            <p className="text-xs text-[var(--text-muted)] text-right">{content.length}/500</p>
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
            <span className="text-sm text-[var(--text)]">Anonim değerlendir</span>
          </label>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
