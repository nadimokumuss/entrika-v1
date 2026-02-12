"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, UserCheck } from "lucide-react";
import { CATEGORIES } from "@entrika/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface PopularUser {
  id: string;
  username: string;
  avatar_url: string;
  reputation_score: number;
  interaction_count: number;
}

interface TrendItem {
  category: string;
  count: number;
}

export default function RightPanel() {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [popularUsers, setPopularUsers] = useState<PopularUser[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadPopularUsers() {
      if (!user) return;

      // Son 24 saatte en cok etkilesim alan kullanicilar
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Reactions in last 24h
      const { data: reactionData } = await supabase
        .from("post_reactions")
        .select("posts!inner(author_id)")
        .gte("created_at", since);

      // Comments in last 24h
      const { data: commentData } = await supabase
        .from("comments")
        .select("posts!inner(author_id)")
        .gte("created_at", since);

      const counts: Record<string, number> = {};
      (reactionData || []).forEach((r: any) => {
        const authorId = r.posts?.author_id;
        if (authorId && authorId !== user.id) {
          counts[authorId] = (counts[authorId] || 0) + 1;
        }
      });
      (commentData || []).forEach((c: any) => {
        const authorId = c.posts?.author_id;
        if (authorId && authorId !== user.id) {
          counts[authorId] = (counts[authorId] || 0) + 1;
        }
      });

      const topIds = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));

      if (topIds.length === 0) {
        // Fallback: en yuksek puanli kullanicilar
        const { data } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, reputation_score")
          .neq("id", user.id)
          .order("reputation_score", { ascending: false })
          .limit(5);
        setPopularUsers((data || []).map((u) => ({ ...u, interaction_count: 0 })));
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, reputation_score")
        .in("id", topIds.map((t) => t.id));

      if (profiles) {
        const mapped = profiles.map((p) => ({
          ...p,
          interaction_count: topIds.find((t) => t.id === p.id)?.count || 0,
        })).sort((a, b) => b.interaction_count - a.interaction_count);
        setPopularUsers(mapped);
      }
    }

    async function loadTrends() {
      const { data } = await supabase
        .from("posts")
        .select("category")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((p) => {
          counts[p.category] = (counts[p.category] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([category, count]) => ({ category, count }));
        setTrends(sorted);
      }
    }

    loadPopularUsers();
    loadTrends();
  }, [user]);

  const handleCategoryClick = (categoryKey: string) => {
    if (activeCategory === categoryKey) {
      router.push("/");
    } else {
      router.push(`/?category=${categoryKey}`);
    }
  };

  return (
    <aside className="sticky top-0 h-screen py-4 px-4 overflow-y-auto">
      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="text"
          placeholder="Entrika'da ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      {/* Trends */}
      {trends.length > 0 && (
        <div className="rounded-xl bg-[var(--card)] p-4 mb-4">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">
            Gundemdekiler
          </h2>
          <div className="flex flex-col gap-2">
            {trends.map((trend) => {
              const cat = CATEGORIES[trend.category as keyof typeof CATEGORIES];
              if (!cat) return null;
              return (
                <button
                  key={trend.category}
                  onClick={() => handleCategoryClick(trend.category)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--card-elevated)] cursor-pointer text-left w-full ${
                    activeCategory === trend.category ? "bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <span className="text-sm font-medium text-[var(--text)]">{cat.label}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{trend.count} paylasim</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Users */}
      {popularUsers.length > 0 && (
        <div className="rounded-xl bg-[var(--card)] p-4 mb-4">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">
            Gunun Populerleri
          </h2>
          <div className="flex flex-col gap-3">
            {popularUsers.map((s) => {
              const following = isFollowing(s.id);
              return (
                <div key={s.id} className="flex items-center justify-between">
                  <Link href={`/u/${s.username}`} className="flex items-center gap-2 min-w-0">
                    <img
                      src={s.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${s.id}`}
                      alt={s.username}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">{s.username}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {s.interaction_count > 0 ? `${s.interaction_count} etkilesim` : `${s.reputation_score.toFixed(1)} puan`}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleFollow(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                      following
                        ? "bg-[var(--card-elevated)] text-[var(--success)] border border-[var(--success)]/30"
                        : "text-white"
                    }`}
                    style={!following ? { background: "var(--primary)" } : undefined}
                  >
                    {following ? (
                      <span className="flex items-center gap-1"><UserCheck size={14} /> Takipte</span>
                    ) : (
                      <span className="flex items-center gap-1"><UserPlus size={14} /> Takip Et</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="rounded-xl bg-[var(--card)] p-4 mb-4">
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">
          Kategoriler
        </h2>
        <div className="flex flex-col gap-1">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => handleCategoryClick(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--card-elevated)] text-left ${
                activeCategory === key ? "bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]" : ""
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="text-sm text-[var(--text)]">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-[var(--text-muted)] px-2 space-y-1">
        <p>Entrika &copy; 2026</p>
        <p>Tanismadan Once Tani</p>
        <Link href="/settings" className="text-[var(--primary)] hover:underline">Ayarlar</Link>
      </div>
    </aside>
  );
}
