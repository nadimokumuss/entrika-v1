// Types
export * from "./types";

// Supabase factory
export { createSupabaseClient } from "./supabase";
export type { SupabaseClient, SupabaseStorageAdapter } from "./supabase";

// Lib factories
export { createFollowingLib } from "./lib/following";
export { createBlockingLib } from "./lib/blocking";
export type { BlockedUserWithProfile } from "./lib/blocking";
export { createMessagingLib } from "./lib/messaging";
export type { ConversationItem } from "./lib/messaging";
export { createBookmarksLib } from "./lib/bookmarks";
export type { Bookmark, BookmarkWithPost } from "./lib/bookmarks";
export { createPremiumLib } from "./lib/premium";
export type {
  PremiumPlan,
  SubscriptionStatus,
  UserSubscription,
  UserDailyLimits,
} from "./lib/premium";
export { FREE_LIMITS, PREMIUM_LIMITS, GOLD_LIMITS } from "./lib/premium";

// Constants
export {
  CATEGORIES,
  REACTIONS,
} from "./constants/categories";
export type {
  PostCategory,
  ReactionType,
  Reaction,
} from "./constants/categories";

export {
  APP_VERSION,
  lightColors,
  darkColors,
  lightGradients,
  darkGradients,
  lightGlass,
  darkGlass,
  spacing,
  borderRadius,
  fontSize,
  shadows,
} from "./constants/theme";
export type {
  ThemeColors,
  ThemeGradients,
  ThemeGlass,
  Theme,
} from "./constants/theme";

// Hooks
export { useError, getErrorType, createError, withRetry } from "./hooks/useError";
export type { ErrorType, AppError } from "./hooks/useError";
