// Supabase Edge Function: send-push-notification
// Database Webhook'lardan tetiklenir, Expo Push API ile bildirim gonderir

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: Record<string, any>;
  schema: string;
}

interface NotificationData {
  recipientId: string;
  title: string;
  body: string;
  data: Record<string, string>;
  channelId?: string;
}

// Tablo adini notification_preferences key'ine esle
const TABLE_PREFERENCE_MAP: Record<string, string> = {
  messages: "messages",
  matches: "matches",
  post_reactions: "comments",
  comments: "comments",
  user_reviews: "reviews",
};

// Alicinin bildirim tercihlerini kontrol et
async function shouldSendNotification(
  recipientId: string,
  table: string
): Promise<boolean> {
  const preferenceKey = TABLE_PREFERENCE_MAP[table];
  if (!preferenceKey) return true; // Bilinmeyen tablo -> gonder

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", recipientId)
    .single();

  const prefs = profile?.notification_preferences;
  if (!prefs) return true; // Tercih ayarlanmamis -> varsayilan olarak gonder

  // Ana push toggle kapali -> hicbir bildirim gonderme
  if (prefs.push_enabled === false) return false;

  // Ilgili kategori kapali -> gonderme
  if (prefs[preferenceKey] === false) return false;

  return true;
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { table, record } = payload;

    // Tabloya gore bildirim verilerini belirle
    const notification = await resolveNotification(table, record);
    if (!notification) {
      return new Response(JSON.stringify({ message: "No notification needed" }), {
        status: 200,
      });
    }

    // Notifications tablosuna kaydet
    await supabase.from("notifications").insert({
      user_id: notification.recipientId,
      type: notification.data.type || table,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });

    // Alicinin bildirim tercihlerini kontrol et
    const allowed = await shouldSendNotification(notification.recipientId, table);
    if (!allowed) {
      return new Response(
        JSON.stringify({ message: "Notification disabled by user preferences" }),
        { status: 200 }
      );
    }

    // Alicinin aktif push tokenlarini al
    const { data: tokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", notification.recipientId)
      .eq("is_active", true);

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active tokens for recipient" }),
        { status: 200 }
      );
    }

    // Expo Push API'ye gonder
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data,
      channelId: notification.channelId || "default",
    }));

    const expoPushResponse = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      }
    );

    const expoPushResult = await expoPushResponse.json();

    // Basarisiz tokenlari deaktif et (DeviceNotRegistered)
    if (expoPushResult.data) {
      const failedTokens: string[] = [];
      expoPushResult.data.forEach((result: any, index: number) => {
        if (
          result.status === "error" &&
          result.details?.error === "DeviceNotRegistered"
        ) {
          failedTokens.push(tokens[index].token);
        }
      });

      if (failedTokens.length > 0) {
        await supabase
          .from("push_tokens")
          .update({ is_active: false })
          .in("token", failedTokens);
      }
    }

    return new Response(JSON.stringify({ success: true, result: expoPushResult }), {
      status: 200,
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
    });
  }
});

// Tabloya gore bildirim icerigini belirle
async function resolveNotification(
  table: string,
  record: Record<string, any>
): Promise<NotificationData | null> {
  switch (table) {
    case "messages": {
      // Kendi mesajin icin bildirim gonderme
      const { data: match } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .eq("id", record.match_id)
        .single();

      if (!match) return null;

      const recipientId =
        match.user1_id === record.sender_id
          ? match.user2_id
          : match.user1_id;

      // Gondericinin ismini al
      const { data: sender } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", record.sender_id)
        .single();

      return {
        recipientId,
        title: sender?.username || "Yeni mesaj",
        body: record.content.length > 100
          ? record.content.substring(0, 100) + "..."
          : record.content,
        data: { type: "message", matchId: record.match_id },
        channelId: "messages",
      };
    }

    case "matches": {
      // Her iki kullaniciya da bildirim gonder - ilk olarak user2'ye
      const { data: user1 } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", record.user1_id)
        .single();

      // user2'ye bildirim
      const notification1: NotificationData = {
        recipientId: record.user2_id,
        title: "Yeni eslesme!",
        body: `${user1?.username || "Biri"} ile eslestiniz!`,
        data: { type: "match", matchId: record.id },
        channelId: "matches",
      };

      // user1'e de bildirim gonder (ayri olarak)
      const { data: user2 } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", record.user2_id)
        .single();

      // Ilk user2'ye gonder, user1'e de ayrica gonderelim
      await sendToRecipient(record.user1_id, {
        recipientId: record.user1_id,
        title: "Yeni eslesme!",
        body: `${user2?.username || "Biri"} ile eslestiniz!`,
        data: { type: "match", matchId: record.id },
        channelId: "matches",
      });

      return notification1;
    }

    case "post_reactions": {
      // Reaksiyon yapilan postin sahibini bul
      const { data: post } = await supabase
        .from("posts")
        .select("author_id, content")
        .eq("id", record.post_id)
        .single();

      if (!post || post.author_id === record.user_id) return null;

      const { data: reactor } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", record.user_id)
        .single();

      return {
        recipientId: post.author_id,
        title: "Yeni reaksiyon",
        body: `${reactor?.username || "Biri"} paylasimina ${record.reaction_type} tepki verdi`,
        data: { type: "reaction", postId: record.post_id },
      };
    }

    case "comments": {
      // Yorum yapilan postin sahibini bul
      const { data: post } = await supabase
        .from("posts")
        .select("author_id")
        .eq("id", record.post_id)
        .single();

      if (!post || post.author_id === record.user_id) return null;

      const { data: commenter } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", record.user_id)
        .single();

      return {
        recipientId: post.author_id,
        title: "Yeni yorum",
        body: `${commenter?.username || "Biri"} paylasimina yorum yapti`,
        data: { type: "comment", postId: record.post_id },
      };
    }

    case "user_reviews": {
      // Degerlendirilen kullaniciya bildirim
      if (record.target_user_id === record.reviewer_id) return null;

      return {
        recipientId: record.target_user_id,
        title: "Yeni degerlendirme",
        body: `Biri sizi degerlendirdi: ${record.score}/5`,
        data: { type: "review" },
      };
    }

    default:
      return null;
  }
}

// Belirli bir aliciya bildirim gonder (matches icin ikinci kullaniciya)
async function sendToRecipient(recipientId: string, notification: NotificationData, table = "matches") {
  // Notifications tablosuna kaydet
  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: notification.data.type || table,
    title: notification.title,
    body: notification.body,
    data: notification.data,
  });

  // Alicinin bildirim tercihlerini kontrol et
  const allowed = await shouldSendNotification(recipientId, table);
  if (!allowed) return;

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", recipientId)
    .eq("is_active", true);

  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data,
    channelId: notification.channelId || "default",
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
}
