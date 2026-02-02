import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// Supabase URL ve Anon Key - bunları kendi Supabase projenizden alın
// Mock modda geçerli bir placeholder URL kullanıyoruz
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// SecureStore adapter for Supabase auth
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore?.getItemAsync(key) ?? null;
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore?.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore?.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export type Gender = "female" | "male";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  gender: Gender;
  reputation_score: number;
  invite_quota: number;
  invited_by: string | null;
  invite_code: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  is_used: boolean;
  created_at: string;
  used_at: string | null;
}

export interface Post {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  is_spoiler: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShadowProfile {
  id: string;
  target_name: string;
  identifier_hash: string;
  city: string;
  avg_score: number;
  total_reviews: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatingProfile {
  id: string;
  user_id: string;
  bio: string;
  photos: string[];
  interests: string[];
  job: string | null;
  education: string | null;
  city: string;
  age: number | null;
  looking_for: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface UserReview {
  id: string;
  target_user_id: string;
  reviewer_id: string;
  score: number;
  content: string | null;
  tags: string[];
  is_anonymous: boolean;
  created_at: string;
}

export type ReportType = "post" | "user" | "shadow_profile";

export interface Report {
  id: string;
  reporter_id: string;
  report_type: ReportType;
  target_id: string;
  reason: string;
  details: string | null;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}
