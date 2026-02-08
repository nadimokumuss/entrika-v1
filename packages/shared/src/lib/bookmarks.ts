import { SupabaseClient } from "@supabase/supabase-js";

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

export function createBookmarksLib(supabase: SupabaseClient) {
  async function addBookmark(userId: string, postId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: userId,
        post_id: postId,
      });

      if (error) {
        if (error.code === "23505") return true;
        console.error("Bookmark ekleme hatasi:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Bookmark ekleme hatasi:", error);
      return false;
    }
  }

  async function removeBookmark(userId: string, postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (error) {
        console.error("Bookmark silme hatasi:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Bookmark silme hatasi:", error);
      return false;
    }
  }

  async function isPostBookmarked(userId: string, postId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("post_id", postId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return false;
        console.error("Bookmark kontrol hatasi:", error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error("Bookmark kontrol hatasi:", error);
      return false;
    }
  }

  async function getUserBookmarks(userId: string, limit: number = 50): Promise<BookmarkWithPost[]> {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
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
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Bookmark'lari getirme hatasi:", error);
        return [];
      }
      return (data as unknown as BookmarkWithPost[]) || [];
    } catch (error) {
      console.error("Bookmark'lari getirme hatasi:", error);
      return [];
    }
  }

  async function getPostBookmarkCount(postId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      if (error) {
        console.error("Bookmark sayisi hatasi:", error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error("Bookmark sayisi hatasi:", error);
      return 0;
    }
  }

  async function toggleBookmark(
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

  function subscribeToBookmarks(
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
            callback({ action: "INSERT", bookmark: payload.new as Bookmark });
          } else if (payload.eventType === "DELETE") {
            callback({ action: "DELETE", bookmark: payload.old as Bookmark });
          }
        }
      )
      .subscribe();
  }

  return {
    addBookmark,
    removeBookmark,
    isPostBookmarked,
    getUserBookmarks,
    getPostBookmarkCount,
    toggleBookmark,
    subscribeToBookmarks,
  };
}
