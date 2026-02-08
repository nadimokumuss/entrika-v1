import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

export interface SupabaseStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Platform-agnostic Supabase client factory.
 * Each platform provides its own storage adapter and env vars.
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  storage: SupabaseStorageAdapter
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
