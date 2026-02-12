"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { blockingLib } from "@/lib/shared";
import { ArrowLeft, Shield, UserX } from "lucide-react";
import Link from "next/link";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export default function BlockedUsersPage() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const data = await blockingLib.getBlockedUsersWithProfiles(user.id);
      setBlockedUsers(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleUnblock = async (blockedId: string) => {
    if (!user) return;
    await blockingLib.unblockUser(user.id, blockedId);
    setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/settings" className="p-1 rounded-lg hover:bg-[var(--card)]">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text)]">Engellenen Kullanicilar</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
          <Shield size={48} className="mb-3 opacity-30" />
          <p>Engellenen kullanici yok</p>
        </div>
      ) : (
        blockedUsers.map((blocked) => (
          <div key={blocked.id} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
            <div className="flex items-center gap-3">
              <img
                src={blocked.blocked_profile?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${blocked.blocked_id}`}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium text-[var(--text)]">
                {blocked.blocked_profile?.username || "Kullanici"}
              </span>
            </div>
            <button
              onClick={() => handleUnblock(blocked.blocked_id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)]/10"
            >
              Engeli Kaldir
            </button>
          </div>
        ))
      )}
    </div>
  );
}
