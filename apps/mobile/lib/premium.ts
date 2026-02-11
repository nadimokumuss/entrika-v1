import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export type PremiumPlan = "premium" | "gold" | null;
export type SubscriptionStatus = "active" | "cancelled" | "expired" | null;

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: "premium" | "gold";
  status: "active" | "cancelled" | "expired";
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
}

export interface UserDailyLimits {
  likes_used: number;
  super_likes_used: number;
  rewinds_used: number;
  boosts_used: number;
  who_liked_views_used: number;
}

// Limit'ler
export const FREE_LIMITS = {
  DAILY_LIKES: 20,
  DAILY_SUPER_LIKES: 0,
  DAILY_REWINDS: 0,
  DAILY_BOOSTS: 0,
  DAILY_WHO_LIKED_VIEWS: 0,
};

export const PREMIUM_LIMITS = {
  DAILY_LIKES: -1, // Unlimited
  DAILY_SUPER_LIKES: 0,
  DAILY_REWINDS: -1, // Unlimited
  DAILY_BOOSTS: 1,
  DAILY_WHO_LIKED_VIEWS: 3,
};

export const GOLD_LIMITS = {
  DAILY_LIKES: -1, // Unlimited
  DAILY_SUPER_LIKES: 3,
  DAILY_REWINDS: -1, // Unlimited
  DAILY_BOOSTS: 2,
  DAILY_WHO_LIKED_VIEWS: -1, // Unlimited
};

/**
 * Kullanıcının premium durumunu kontrol et
 */
export async function getUserPremiumStatus(
  userId: string
): Promise<{ plan: PremiumPlan; status: SubscriptionStatus; subscription: UserSubscription | null }> {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { plan: null, status: null, subscription: null };
    }

    return {
      plan: data.plan_type,
      status: data.status,
      subscription: data,
    };
  } catch (error) {
    console.error("Error fetching premium status:", error);
    return { plan: null, status: null, subscription: null };
  }
}

/**
 * Kullanıcının günlük limitlerini getir
 */
export async function getUserDailyLimits(
  userId: string
): Promise<UserDailyLimits | null> {
  try {
    const { data, error } = await supabase
      .from("user_daily_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", new Date().toISOString().split("T")[0])
      .maybeSingle();

    if (error || !data) {
      // Yeni gün için kayıt oluştur
      const { data: newData, error: insertError } = await supabase
        .from("user_daily_limits")
        .insert({
          user_id: userId,
          date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (insertError || !newData) {
        return null;
      }

      return {
        likes_used: newData.likes_used,
        super_likes_used: newData.super_likes_used,
        rewinds_used: newData.rewinds_used,
        boosts_used: newData.boosts_used,
        who_liked_views_used: newData.who_liked_views_used,
      };
    }

    return {
      likes_used: data.likes_used,
      super_likes_used: data.super_likes_used,
      rewinds_used: data.rewinds_used,
      boosts_used: data.boosts_used,
      who_liked_views_used: data.who_liked_views_used,
    };
  } catch (error) {
    console.error("Error fetching daily limits:", error);
    return null;
  }
}

/**
 * Günlük limit kullanımını artır
 */
export async function incrementDailyLimit(
  userId: string,
  field: keyof UserDailyLimits
): Promise<boolean> {
  try {
    // First get current value
    const { data: currentData } = await supabase
      .from("user_daily_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", new Date().toISOString().split("T")[0])
      .maybeSingle();

    const currentValue = (currentData?.[field] as number) || 0;

    // Then update with incremented value
    const { error } = await supabase
      .from("user_daily_limits")
      .update({
        [field]: currentValue + 1,
      })
      .eq("user_id", userId)
      .eq("date", new Date().toISOString().split("T")[0]);

    return !error;
  } catch (error) {
    console.error("Error incrementing daily limit:", error);
    return false;
  }
}

/**
 * Kullanıcının aktif boost'u var mı kontrol et
 */
export async function hasActiveBoost(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_boosts")
      .select("*")
      .eq("user_id", userId)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    return !!data && !error;
  } catch (error) {
    console.error("Error checking active boost:", error);
    return false;
  }
}

/**
 * Boost başlat
 */
export async function startBoost(userId: string, durationMinutes: number = 30): Promise<boolean> {
  try {
    // Önce aktif boost var mı kontrol et
    const active = await hasActiveBoost(userId);
    if (active) {
      return false; // Zaten aktif boost var
    }

    const { error } = await supabase.from("user_boosts").insert({
      user_id: userId,
      duration_minutes: durationMinutes,
      expires_at: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
    });

    if (error) return false;

    // Günlük boost kullanımını artır
    await incrementDailyLimit(userId, "boosts_used");

    return true;
  } catch (error) {
    console.error("Error starting boost:", error);
    return false;
  }
}

/**
 * Profil görüntüleme kaydı ekle
 */
export async function recordProfileView(
  viewerId: string,
  viewedId: string
): Promise<void> {
  try {
    await supabase.from("profile_views").insert({
      viewer_id: viewerId,
      viewed_id: viewedId,
    });
  } catch (error) {
    // Duplicate hatası görmezden gel (aynı kişi tekrar bakarsa)
    console.error("Error recording profile view:", error);
  }
}

/**
 * Profil görüntüleme sayısını getir
 */
export async function getProfileViewCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("viewed_id", userId);

    return count || 0;
  } catch (error) {
    console.error("Error getting profile view count:", error);
    return 0;
  }
}

/**
 * Kim profiline baktı listesini getir (Gold kullanıcılar için)
 */
export async function getProfileViewers(
  userId: string
): Promise<Array<{ id: string; username: string; avatar_url: string; viewed_at: string }> | null> {
  try {
    const { data, error } = await supabase
      .from("profile_views")
      .select(`
        viewer_id,
        viewed_at,
        viewer:viewer_id (username, avatar_url)
      `)
      .eq("viewed_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(50);

    if (error || !data) return null;

    return data.map((view: any) => ({
      id: view.viewer_id,
      username: view.viewer?.username || "Unknown",
      avatar_url: view.viewer?.avatar_url || null,
      viewed_at: view.viewed_at,
    }));
  } catch (error) {
    console.error("Error getting profile viewers:", error);
    return null;
  }
}

/**
 * React Hook: Premium status ve limit'ler
 * NOT: Bu hook henüz aktif kullanılmıyor. Aktif kullanıma geçildiğinde
 * userId parametresi alıp getUserPremiumStatus ve getUserDailyLimits ile
 * gerçek veri çekmesi gerekecek.
 */
export function usePremium() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PremiumPlan>(null);
  const [status, setStatus] = useState<SubscriptionStatus>(null);
  const [limits, setLimits] = useState<UserDailyLimits | null>(null);
  const [hasBoost, setHasBoost] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const isPremium = plan === "premium" || plan === "gold";
  const isGold = plan === "gold";
  const isFree = plan === null;

  const getLimits = () => {
    if (isGold) return GOLD_LIMITS;
    if (isPremium) return PREMIUM_LIMITS;
    return FREE_LIMITS;
  };

  const remainingLikes = getLimits().DAILY_LIKES === -1
    ? -1
    : Math.max(0, getLimits().DAILY_LIKES - (limits?.likes_used || 0));

  return {
    loading,
    plan,
    status,
    isPremium,
    isGold,
    isFree,
    limits,
    hasBoost,
    remainingLikes,
    getLimits,
  };
}
