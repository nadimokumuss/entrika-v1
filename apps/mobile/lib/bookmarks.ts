import { supabase } from "./supabase";

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface BookmarkWithPost extends Bookmark {
  posts: {
    id: string;
    content: string;
    category: string;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string;
    };
  };
}

/**
 * Bir postu bookmark ekle
 */
export async function addBookmark(userId: string, postId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("bookmarks").insert({
      user_id: userId,
      post_id: postId,
    });

    if (error) {
      // Unique constraint violation - zaten bookmarklanmış
      if (error.code === "23505") {
        return true;
      }
      console.error("Bookmark ekleme hatası:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Bookmark ekleme hatası:", error);
    return false;
  }
}

/**
 * Bir postun bookmark'ını kaldır
 */
export async function removeBookmark(userId: string, postId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (error) {
      console.error("Bookmark silme hatası:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Bookmark silme hatası:", error);
    return false;
  }
}

/**
 * Bir postun bookmarklı olup olmadığını kontrol et
 */
export async function isPostBookmarked(
  userId: string,
  postId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Kayıt bulunamadı - bookmark değil
        return false;
      }
      console.error("Bookmark kontrol hatası:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Bookmark kontrol hatası:", error);
    return false;
  }
}

/**
 * Kullanıcının tüm bookmark'larını getir
 */
export async function getUserBookmarks(
  userId: string,
  limit: number = 50
): Promise<BookmarkWithPost[]> {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select(
        `
        id,
        user_id,
        post_id,
        created_at,
        posts (
          id,
          content,
          category,
          created_at,
          profiles (username, avatar_url)
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Bookmark'ları getirme hatası:", error);
      return [];
    }

    return (data as unknown as BookmarkWithPost[]) || [];
  } catch (error) {
    console.error("Bookmark'ları getirme hatası:", error);
    return [];
  }
}

/**
 * Bir postun bookmark sayısını getir
 */
export async function getPostBookmarkCount(postId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error) {
      console.error("Bookmark sayısı hatası:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Bookmark sayısı hatası:", error);
    return 0;
  }
}

/**
 * Bookmark toggle (ekle/kaldır)
 */
export async function toggleBookmark(
  userId: string,
  postId: string
): Promise<{ success: boolean; isBookmarked: boolean }> {
  const currentlyBookmarked = await isPostBookmarked(userId, postId);

  if (currentlyBookmarked) {
    const success = await removeBookmark(userId, postId);
    return { success, isBookmarked: false };
  } else {
    const success = await addBookmark(userId, postId);
    return { success, isBookmarked: true };
  }
}

/**
 * Realtime bookmark subscription
 */
export function subscribeToBookmarks(
  userId: string,
  callback: (payload: { action: "INSERT" | "DELETE"; bookmark: Bookmark }) => void
) {
  return supabase
    .channel("bookmarks_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookmarks",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          callback({
            action: "INSERT",
            bookmark: payload.new as Bookmark,
          });
        } else if (payload.eventType === "DELETE") {
          callback({
            action: "DELETE",
            bookmark: payload.old as Bookmark,
          });
        }
      }
    )
    .subscribe();
}
