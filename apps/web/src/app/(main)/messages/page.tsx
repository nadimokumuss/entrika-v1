"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messagingLib } from "@/lib/shared";
import type { ConversationItem } from "@entrika/shared";
import Link from "next/link";

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const data = await messagingLib.fetchConversations(user.id);
      setConversations(data);
      setLoading(false);
    }
    load();
  }, [user]);

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "az once";
    if (mins < 60) return `${mins}dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa`;
    return `${Math.floor(hours / 24)}g`;
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Mesajlar</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          Henuz mesajin yok. Eslestikten sonra sohbet baslayabilirsin.
        </div>
      ) : (
        conversations.map((conv) => (
          <Link
            key={conv.matchId}
            href={`/messages/${conv.matchId}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30"
          >
            <img
              src={conv.otherAvatarUrl}
              alt={conv.otherUsername}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text)]">{conv.otherUsername}</span>
                <span className="text-xs text-[var(--text-muted)]">{timeAgo(conv.lastMessageAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-muted)] truncate">{conv.lastMessage || "Henuz mesaj yok"}</p>
                {conv.unreadCount > 0 && (
                  <span className="ml-2 w-5 h-5 flex items-center justify-center rounded-full text-xs text-white" style={{ background: "var(--primary)" }}>
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
