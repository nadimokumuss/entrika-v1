import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { followUser, unfollowUser, isFollowing, getFollowingIds } from "@/lib/following";

interface FollowContextType {
  followingIds: Set<string>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  refreshFollowing: () => Promise<void>;
  isLoading: boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load current user from auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        loadFollowing(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        loadFollowing(session.user.id);
      } else {
        setCurrentUserId(null);
        setFollowingIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for follows table changes
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("follows-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `follower_id=eq.${currentUserId}`,
        },
        async () => {
          await loadFollowing(currentUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadFollowing = async (userId: string) => {
    try {
      setIsLoading(true);
      const ids = await getFollowingIds(userId);
      setFollowingIds(new Set(ids));
    } catch (error) {
      console.error("Error loading following:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const follow = useCallback(async (userId: string) => {
    if (!currentUserId) return;

    const { error } = await followUser(currentUserId, userId);
    if (!error) {
      setFollowingIds((prev) => new Set([...prev, userId]));
    }
  }, [currentUserId]);

  const unfollow = useCallback(async (userId: string) => {
    if (!currentUserId) return;

    const { error } = await unfollowUser(currentUserId, userId);
    if (!error) {
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [currentUserId]);

  const checkIsFollowing = useCallback(
    (userId: string) => followingIds.has(userId),
    [followingIds]
  );

  const refreshFollowing = useCallback(async () => {
    if (currentUserId) {
      await loadFollowing(currentUserId);
    }
  }, [currentUserId]);

  return (
    <FollowContext.Provider
      value={{
        followingIds,
        followUser: follow,
        unfollowUser: unfollow,
        isFollowing: checkIsFollowing,
        refreshFollowing,
        isLoading,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
}
