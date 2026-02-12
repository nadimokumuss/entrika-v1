"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { followingLib } from "@/lib/shared";
import { UserPlus, UserMinus, Search, TrendingUp, Clock, Shield, MapPin } from "lucide-react";
import Link from "next/link";

interface ExploreUser {
  id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
  city: string | null;
  reputation_score: number;
}

type ExploreTab = "popular" | "new" | "trusted" | "nearby";

export default function ExplorePage() {
  const { user, profile: myProfile } = useAuth();
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ExploreTab>("popular");

  const loadUsers = async (tab: ExploreTab) => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, city, reputation_score")
      .neq("id", user?.id || "");

    switch (tab) {
      case "popular":
        query = query.order("reputation_score", { ascending: false });
        break;
      case "new":
        query = query.order("created_at", { ascending: false });
        break;
      case "trusted":
        query = query.order("reputation_score", { ascending: false }).gte("reputation_score", 7);
        break;
      case "nearby":
        if (myProfile?.city) {
          query = query.eq("city", myProfile.city);
        }
        query = query.order("reputation_score", { ascending: false });
        break;
    }

    const { data } = await query.limit(50);
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers(activeTab);
    if (user) {
      followingLib.getFollowingIds(user.id).then((ids) => setFollowingIds(new Set(ids)));
    }
  }, [user, activeTab]);

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

  const filteredUsers = users.filter(
    (u) => !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.bio?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: ExploreTab; label: string; icon: React.ReactNode }[] = [
    { key: "popular", label: "Popüler", icon: <TrendingUp size={16} /> },
    { key: "new", label: "Yeni Üyeler", icon: <Clock size={16} /> },
    { key: "trusted", label: "En Güvenilir", icon: <Shield size={16} /> },
    { key: "nearby", label: "Yakınımdakiler", icon: <MapPin size={16} /> },
  ];

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 space-y-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Keşfet</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--card)] text-[var(--text)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                activeTab === tab.key
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border-light)] text-[var(--text-muted)] hover:border-[var(--border)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          {activeTab === "nearby" && !myProfile?.city
            ? "Şehir bilgin profilinde belirtilmemiş."
            : "Henüz kullanıcı yok"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {filteredUsers.map((u) => {
            const isFollowing = followingIds.has(u.id);
            return (
              <div key={u.id} className="rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-4 hover:shadow-md transition-shadow">
                <Link href={`/u/${u.username}`} className="flex items-center gap-3 mb-3">
                  <img
                    src={u.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${u.id}`}
                    alt={u.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--text)] truncate">{u.username}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                        backgroundColor: u.reputation_score >= 7 ? "var(--success)" : u.reputation_score >= 4 ? "var(--primary)" : "var(--danger)",
                        color: "white",
                        opacity: 0.9,
                      }}>
                        {u.reputation_score.toFixed(1)}
                      </span>
                      {u.city && <span className="text-xs text-[var(--text-muted)]">{u.city}</span>}
                    </div>
                  </div>
                </Link>
                {u.bio && <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">{u.bio}</p>}
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium ${
                    isFollowing
                      ? "bg-[var(--card-elevated)] text-[var(--text)] border border-[var(--border)]"
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
