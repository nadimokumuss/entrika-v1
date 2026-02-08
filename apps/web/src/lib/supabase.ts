import { createSupabaseClient } from "@entrika/shared/src/supabase";
import type { SupabaseStorageAdapter } from "@entrika/shared/src/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const webStorageAdapter: SupabaseStorageAdapter = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};

export const supabase = createSupabaseClient(
  supabaseUrl,
  supabaseAnonKey,
  webStorageAdapter
);
