"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { followingLib } from "@/lib/shared";

interface FollowContextType {
  followingIds: Set<string>;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => Promise<void>;
  refreshFollowing: () => Promise<void>;
}

const FollowContext = createContext<FollowContextType>({
  followingIds: new Set(),
  isFollowing: () => false,
  toggleFollow: async () => {},
  refreshFollowing: async () => {},
});

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const refreshFollowing = useCallback(async () => {
    if (!user) return;
    const ids = await followingLib.getFollowingIds(user.id);
    setFollowingIds(new Set(ids));
  }, [user]);

  useEffect(() => {
    refreshFollowing();
  }, [refreshFollowing]);

  const isFollowingUser = useCallback(
    (userId: string) => followingIds.has(userId),
    [followingIds]
  );

  const toggleFollow = useCallback(
    async (targetId: string) => {
      if (!user) return;
      const isCurrentlyFollowing = followingIds.has(targetId);

      // Optimistic update
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.delete(targetId);
        } else {
          next.add(targetId);
        }
        return next;
      });

      if (isCurrentlyFollowing) {
        const { error } = await followingLib.unfollowUser(user.id, targetId);
        if (error) refreshFollowing(); // Revert on error
      } else {
        const { error } = await followingLib.followUser(user.id, targetId);
        if (error) refreshFollowing();
      }
    },
    [user, followingIds, refreshFollowing]
  );

  return (
    <FollowContext.Provider
      value={{
        followingIds,
        isFollowing: isFollowingUser,
        toggleFollow,
        refreshFollowing,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  return useContext(FollowContext);
}
