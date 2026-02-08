"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@entrika/shared";
import type { PostCategory } from "@entrika/shared";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function NewPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("itiraf");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("posts").insert({
      content: content.trim(),
      category,
      is_anonymous: isAnonymous,
      author_id: user.id,
    });

    if (insertError) {
      setError("Paylasim yapilamadi. Tekrar deneyin.");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 rounded-lg hover:bg-[var(--card)]">
            <ArrowLeft size={20} className="text-[var(--text)]" />
          </Link>
          <h1 className="text-lg font-bold text-[var(--text)]">Yeni Paylasim</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="px-5 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-40"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Paylasiliyor..." : "Paylas"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        {/* Category Selection */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(CATEGORIES) as [PostCategory, typeof CATEGORIES[PostCategory]][]).map(
            ([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  category === key
                    ? "border-transparent text-white"
                    : "border-[var(--border-light)] text-[var(--text-muted)] hover:bg-[var(--card)]"
                }`}
                style={category === key ? { backgroundColor: cat.color } : undefined}
              >
                {cat.emoji} {cat.label}
              </button>
            )
          )}
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ne dusunuyorsun?"
          rows={6}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none resize-none"
        />

        <div className="flex items-center justify-between">
          {/* Anonymous toggle */}
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${
              isAnonymous
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border-light)] text-[var(--text-muted)]"
            }`}
          >
            {isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}
            {isAnonymous ? "Anonim" : "Isimli"}
          </button>

          {/* Character count */}
          <span className="text-xs text-[var(--text-muted)]">
            {content.length}/500
          </span>
        </div>
      </form>
    </div>
  );
}
