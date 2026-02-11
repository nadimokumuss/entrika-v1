import { supabase } from "@/lib/supabase";

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  return { error };
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  return { error };
}

/**
 * Check if a user is following another
 */
export async function isFollowing(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();
  return { isFollowing: !!data, error };
}

/**
 * Get followers of a user
 */
export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(username, avatar_url)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });
  return { followers: data, error };
}

/**
 * Get users that a user is following
 */
export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(username, avatar_url)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });
  return { following: data, error };
}

/**
 * Get follow counts (followers and following)
 */
export async function getFollowCounts(userId: string) {
  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  return {
    followersCount: followersResult.count || 0,
    followingCount: followingResult.count || 0,
  };
}

/**
 * Get IDs of users that the current user is following
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  return (data || []).map((f) => f.following_id);
}
