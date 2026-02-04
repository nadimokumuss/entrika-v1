import { supabase } from "./supabase";

export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const { error } = await supabase
    .from("blocked_users")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });

  if (error) {
    console.error("Block error:", error);
    return false;
  }
  return true;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  if (error) {
    console.error("Unblock error:", error);
    return false;
  }
  return true;
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", userId);

  if (error) {
    console.error("Get blocked IDs error:", error);
    return [];
  }
  return (data || []).map((row) => row.blocked_id);
}

export async function isUserBlocked(blockerId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", userId)
    .maybeSingle();

  if (error) {
    console.error("isUserBlocked error:", error);
    return false;
  }
  return !!data;
}

export interface BlockedUserWithProfile {
  id: string;
  blocked_id: string;
  created_at: string;
  username: string;
  avatar_url: string;
}

export async function getBlockedUsersWithProfiles(
  userId: string
): Promise<BlockedUserWithProfile[]> {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id, blocked_id, created_at, profiles!blocked_users_blocked_id_fkey(username, avatar_url)")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get blocked users error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    blocked_id: row.blocked_id,
    created_at: row.created_at,
    username: row.profiles?.username || "Kullanici",
    avatar_url: row.profiles?.avatar_url || "",
  }));
}
