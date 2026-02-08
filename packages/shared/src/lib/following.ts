import { SupabaseClient } from "@supabase/supabase-js";

export function createFollowingLib(supabase: SupabaseClient) {
  async function followUser(followerId: string, followingId: string) {
    const { error } = await supabase.from("follows").insert({
      follower_id: followerId,
      following_id: followingId,
    });
    return { error };
  }

  async function unfollowUser(followerId: string, followingId: string) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    return { error };
  }

  async function isFollowing(followerId: string, followingId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single();
    return { isFollowing: !!data, error };
  }

  async function getFollowers(userId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id, profiles!follows_follower_id_fkey(username, avatar_url)")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });
    return { followers: data, error };
  }

  async function getFollowing(userId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("following_id, profiles!follows_following_id_fkey(username, avatar_url)")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });
    return { following: data, error };
  }

  async function getFollowCounts(userId: string) {
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

  async function getFollowingIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    return (data || []).map((f) => f.following_id);
  }

  return {
    followUser,
    unfollowUser,
    isFollowing,
    getFollowers,
    getFollowing,
    getFollowCounts,
    getFollowingIds,
  };
}
