import { supabase } from "./supabase";
import {
  createFollowingLib,
  createBlockingLib,
  createMessagingLib,
  createBookmarksLib,
  createPremiumLib,
} from "@entrika/shared";

export const followingLib = createFollowingLib(supabase);
export const blockingLib = createBlockingLib(supabase);
export const messagingLib = createMessagingLib(supabase);
export const bookmarksLib = createBookmarksLib(supabase);
export const premiumLib = createPremiumLib(supabase);
