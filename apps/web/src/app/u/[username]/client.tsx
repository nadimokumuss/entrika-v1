"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { supabase } from "@/lib/supabase";
import { followingLib } from "@/lib/shared";
import { CATEGORIES } from "@entrika/shared";
import { ArrowLeft, UserPlus, UserMinus, Shield } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
  reputation_score: number;
  gender: string;
  created_at: string;
}

interface UserPost {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  created_at: string;
}

export default function UserProfileClient({ username }: { username: string }) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollow();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const [postsResult, countsResult] = await Promise.all([
        supabase
          .from("posts")
          .select("id, content, category, is_anonymous, created_at")
          .eq("author_id", profileData.id)
          .eq("is_anonymous", false)
          .order("created_at", { ascending: false })
          .limit(20),
        followingLib.getFollowCounts(profileData.id),
      ]);

      setPosts(postsResult.data || []);
      setFollowersCount(countsResult.followersCount);
      setFollowingCount(countsResult.followingCount);
      setLoading(false);
    }
    load();
  }, [username]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "az once";
    if (mins < 60) return `${mins}dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa`;
    return `${Math.floor(hours / 24)}g`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">Kullanici bulunamadi.</p>
        <Link href="/" className="mt-4 text-[var(--primary)] hover:underline text-sm">
          Ana sayfaya don
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const following = isFollowing(profile.id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-[var(--card)]">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">{profile.username}</h1>
          <p className="text-xs text-[var(--text-muted)]">{posts.length} paylasim</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-start justify-between">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${profile.id}`}
            alt={profile.username}
            className="w-20 h-20 rounded-full object-cover"
          />
          {!isOwnProfile && user && (
            <div className="flex gap-2">
              <button
                onClick={() => toggleFollow(profile.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${
                  following
                    ? "bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
                    : "text-white"
                }`}
                style={!following ? { background: "var(--primary)" } : undefined}
              >
                {following ? <><UserMinus size={16} /> Takipte</> : <><UserPlus size={16} /> Takip Et</>}
              </button>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-[var(--text)] mt-3">{profile.username}</h2>
        {profile.bio && <p className="text-sm text-[var(--text-muted)] mt-1">{profile.bio}</p>}

        <div className="flex gap-4 mt-3">
          <span className="text-sm"><strong className="text-[var(--text)]">{followersCount}</strong> <span className="text-[var(--text-muted)]">takipci</span></span>
          <span className="text-sm"><strong className="text-[var(--text)]">{followingCount}</strong> <span className="text-[var(--text-muted)]">takip</span></span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium">
          <Shield size={14} />
          {profile.reputation_score.toFixed(1)} puan
        </div>
      </div>

      {/* Posts */}
      <div className="border-t border-[var(--border-light)]">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            Henuz paylasim yok.
          </div>
        ) : (
          posts.map((post) => {
            const cat = CATEGORIES[post.category as keyof typeof CATEGORIES];
            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block px-4 py-4 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-[var(--text-muted)]">{timeAgo(post.created_at)}</span>
                  {cat && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: cat.color + "20", color: cat.color }}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                  )}
                </div>
                <p className="text-[var(--text)] line-clamp-3">{post.content}</p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
