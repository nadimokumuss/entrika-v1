"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { followingLib } from "@/lib/shared";
import { Settings, Edit3 } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [postCount, setPostCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", user.id);
      setPostCount(count || 0);

      const counts = await followingLib.getFollowCounts(user.id);
      setFollowersCount(counts.followersCount);
      setFollowingCount(counts.followingCount);
    }
    load();
  }, [user]);

  if (!profile) return null;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text)]">Profil</h1>
        <Link href="/settings" className="p-2 rounded-lg hover:bg-[var(--card)]">
          <Settings size={20} className="text-[var(--text-muted)]" />
        </Link>
      </div>

      <div className="px-4 py-6">
        {/* Avatar & Info */}
        <div className="flex items-start gap-4">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${profile.id}`}
            alt={profile.username}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[var(--text)]">{profile.username}</h2>
            {profile.bio && <p className="mt-1 text-sm text-[var(--text-muted)]">{profile.bio}</p>}
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <p className="font-bold text-[var(--text)]">{postCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Paylasim</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-[var(--text)]">{followersCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Takipci</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-[var(--text)]">{followingCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Takip</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reputation */}
        <div className="mt-6 p-4 rounded-xl bg-[var(--card)]">
          <p className="text-sm text-[var(--text-muted)]">Topluluk Puani</p>
          <p className="text-2xl font-bold text-[var(--primary)]">{profile.reputation_score.toFixed(1)}</p>
        </div>

        <button className="mt-4 w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--card)]">
          <Edit3 size={16} />
          Profili Duzenle
        </button>
      </div>
    </div>
  );
}
