import { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { Message } from "../types";

export interface ConversationItem {
  matchId: string;
  otherUserId: string;
  otherUsername: string;
  otherAvatarUrl: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export function createMessagingLib(supabase: SupabaseClient) {
  async function fetchConversations(
    userId: string
  ): Promise<ConversationItem[]> {
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id, created_at")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (matchError || !matches || matches.length === 0) return [];

    const otherUserIds = matches.map((m) =>
      m.user1_id === userId ? m.user2_id : m.user1_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", otherUserIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    const conversations: ConversationItem[] = [];

    for (const match of matches) {
      const otherUserId =
        match.user1_id === userId ? match.user2_id : match.user1_id;
      const profile = profileMap.get(otherUserId);

      const { data: lastMsgData } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("match_id", match.id)
        .eq("is_read", false)
        .neq("sender_id", userId);

      const lastMsg = lastMsgData?.[0] ?? null;

      conversations.push({
        matchId: match.id,
        otherUserId,
        otherUsername: profile?.username || "Kullanici",
        otherAvatarUrl:
          profile?.avatar_url ||
          `https://api.dicebear.com/7.x/lorelei/png?seed=${otherUserId}`,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.created_at ?? match.created_at,
        unreadCount: count ?? 0,
      });
    }

    conversations.sort((a, b) => {
      const timeA = a.lastMessageAt || "";
      const timeB = b.lastMessageAt || "";
      return timeB.localeCompare(timeA);
    });

    return conversations;
  }

  async function fetchTotalUnreadCount(userId: string): Promise<number> {
    const { data: matches } = await supabase
      .from("matches")
      .select("id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!matches || matches.length === 0) return 0;

    const matchIds = matches.map((m) => m.id);

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("match_id", matchIds)
      .eq("is_read", false)
      .neq("sender_id", userId);

    return count ?? 0;
  }

  async function fetchMessages(matchId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return data || [];
  }

  async function sendMessage(
    matchId: string,
    senderId: string,
    content: string
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    return data;
  }

  async function markMessagesAsRead(
    matchId: string,
    currentUserId: string
  ): Promise<void> {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("match_id", matchId)
      .eq("is_read", false)
      .neq("sender_id", currentUserId);
  }

  function subscribeToMessages(
    matchId: string,
    callback: (message: Message) => void
  ): RealtimeChannel {
    return supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }

  function subscribeToAllMessages(callback: () => void): RealtimeChannel {
    return supabase
      .channel("all-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          callback();
        }
      )
      .subscribe();
  }

  return {
    fetchConversations,
    fetchTotalUnreadCount,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    subscribeToMessages,
    subscribeToAllMessages,
  };
}
