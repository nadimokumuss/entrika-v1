import "react-native-url-polyfill/dist/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Supabase URL ve Anon Key - bunları kendi Supabase projenizden alın
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

// SecureStore adapter for Supabase auth
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_liked: boolean;
  user2_liked: boolean;
  is_match: boolean;
  created_at: string;
  matched_at: string | null;
}
