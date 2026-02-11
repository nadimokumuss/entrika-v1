"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { followingLib } from "@/lib/shared";
import { UserPlus, UserMinus, Search } from "lucide-react";

interface ExploreUser {
  id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
  reputation_score: number;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, reputation_score")
        .neq("id", user?.id || "")
        .order("reputation_score", { ascending: false })
        .limit(50);
      setUsers(data || []);

      if (user) {
        const ids = await followingLib.getFollowingIds(user.id);
        setFollowingIds(new Set(ids));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = followingIds.has(targetId);

    if (isFollowing) {
      await followingLib.unfollowUser(user.id, targetId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } else {
      await followingLib.followUser(user.id, targetId);
      setFollowingIds((prev) => new Set(prev).add(targetId));
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 space-y-2">
        <h1 className="text-xl font-bold text-[var(--text)]">Kesfet</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Kullanici ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--card)] text-[var(--text)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {users.filter((u) => !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.bio?.toLowerCase().includes(search.toLowerCase())).map((u) => {
            const isFollowing = followingIds.has(u.id);
            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${u.id}`}
                    alt={u.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-[var(--text)]">{u.username}</p>
                    {u.bio && <p className="text-sm text-[var(--text-muted)] line-clamp-1">{u.bio}</p>}
                    <p className="text-xs text-[var(--text-muted)]">Puan: {u.reputation_score.toFixed(1)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${
                    isFollowing
                      ? "bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
                      : "text-white"
                  }`}
                  style={!isFollowing ? { background: "var(--primary)" } : undefined}
                >
                  {isFollowing ? <><UserMinus size={16} /> Takipte</> : <><UserPlus size={16} /> Takip Et</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
