"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { supabase } from "@/lib/supabase";
import { Bell, MessageCircle, Heart, Star, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

interface SenderProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { resetUnreadCount } = useNotifications();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, SenderProfile>>({});

  const fetchSenderProfiles = useCallback(async (notifs: Notification[]) => {
    const senderIds = [...new Set(
      notifs
        .map(n => n.data?.sender_id)
        .filter((id): id is string => !!id)
    )];
    if (senderIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", senderIds);

    if (data) {
      const map: Record<string, SenderProfile> = {};
      data.forEach((p: SenderProfile) => { map[p.id] = p; });
      setSenderProfiles(prev => ({ ...prev, ...map }));
    }
  }, []);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      const notifs = data || [];
      setNotifications(notifs);
      setLoading(false);
      fetchSenderProfiles(notifs);

      // Mark as read and reset badge
      resetUnreadCount();
    }
    load();
  }, [user, resetUnreadCount, fetchSenderProfiles]);

  // Realtime: prepend new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-page-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          fetchSenderProfiles([newNotif]);
          // Mark as read immediately since user is on this page
          supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", newNotif.id)
            .then();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSenderProfiles]);

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
      case "comment_reply":
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
      case "comment_reply":
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

  const renderBody = (n: Notification) => {
    const data = n.data || {};
    const senderId = data.sender_id;
    const sender = senderId ? senderProfiles[senderId] : null;

    if (sender && n.body.includes(sender.username)) {
      const parts = n.body.split(sender.username);
      return (
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          {parts[0]}
          <Link
            href={`/u/${sender.username}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {sender.username}
          </Link>
          {parts.slice(1).join(sender.username)}
        </p>
      );
    }

    return <p className="text-sm text-[var(--text-muted)] mt-0.5">{n.body}</p>;
  };

  const renderAvatar = (n: Notification) => {
    const data = n.data || {};
    const senderId = data.sender_id;
    const sender = senderId ? senderProfiles[senderId] : null;

    if (sender) {
      return (
        <Link href={`/u/${sender.username}`} onClick={(e) => e.stopPropagation()}>
          <img
            src={sender.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${sender.id}`}
            alt=""
            className="w-9 h-9 rounded-full object-cover hover:opacity-80 shrink-0"
          />
        </Link>
      );
    }

    return <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>;
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
              {renderAvatar(n)}
              <div className="flex-1">
                <p className="font-medium text-[var(--text)]">{n.title}</p>
                {renderBody(n)}
              </div>
              <span className="text-xs text-[var(--text-muted)] shrink-0">{timeAgo(n.created_at)}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
