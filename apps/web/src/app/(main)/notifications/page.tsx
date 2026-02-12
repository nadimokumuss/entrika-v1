"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Bell, MessageCircle, Heart, Star, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);

      // Mark as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }
    load();
  }, [user]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "az once";
    if (mins < 60) return `${mins}dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa`;
    return `${Math.floor(hours / 24)}g`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "reaction":
        return <MessageCircle size={18} className="text-[var(--primary)]" />;
      case "message":
        return <Heart size={18} className="text-[var(--accent)]" />;
      case "match":
        return <Users size={18} className="text-[var(--success)]" />;
      case "review":
        return <Star size={18} className="text-[var(--warning)]" />;
      default:
        return <Bell size={18} className="text-[var(--text-muted)]" />;
    }
  };

  const handleClick = (n: Notification) => {
    const data = n.data || {};

    switch (n.type) {
      case "comment":
      case "reaction":
        if (data.post_id) router.push(`/post/${data.post_id}`);
        break;
      case "message":
        if (data.match_id) router.push(`/messages/${data.match_id}`);
        else router.push("/messages");
        break;
      case "match":
        router.push("/messages");
        break;
      case "review":
        router.push("/profile");
        break;
      case "follow":
        if (data.username) router.push(`/u/${data.username}`);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Bildirimler</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
          <Bell size={48} className="mb-3 opacity-30" />
          <p>Henuz bildirim yok</p>
        </div>
      ) : (
        notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full text-left px-4 py-3 border-b border-[var(--border-light)] hover:bg-[var(--card)]/30 transition-colors ${
              !n.is_read ? "bg-[var(--primary)]/5" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text)]">{n.title}</p>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">{n.body}</p>
              </div>
              <span className="text-xs text-[var(--text-muted)] shrink-0">{timeAgo(n.created_at)}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
