import { supabase } from "./supabase";

// Analytics event tipleri
export type AnalyticsEvent =
  // Screen events
  | "screen_view"
  // Engagement events
  | "post_like"
  | "post_unlike"
  | "post_comment"
  | "post_share"
  | "post_edit"
  | "post_delete"
  | "reaction_add"
  | "reaction_remove"
  // Match events
  | "swipe_left"
  | "swipe_right"
  | "super_like"
  | "match"
  | "unmatch"
  // Message events
  | "message_send"
  | "message_receive"
  | "conversation_open"
  // Profile events
  | "profile_view"
  | "profile_edit"
  | "avatar_upload"
  // Premium events
  | "premium_view"
  | "premium_upgrade_click"
  | "premium_upgrade_success"
  | "premium_upgrade_fail"
  | "boost_start"
  | "rewind_use"
  // Filter events
  | "filter_apply"
  | "filter_reset"
  // Notification events
  | "notification_open"
  | "notification_click"
  | "notification_settings_open"
  // Settings events
  | "settings_open"
  | "logout"
  // App events
  | "app_open"
  | "app_background";

// User properties
export interface UserProperties {
  user_id: string;
  username?: string;
  created_at?: string;
  is_premium?: boolean;
  premium_plan?: "premium" | "gold" | null;
  profile_completed?: boolean;
  dating_profile_completed?: boolean;
  post_count?: number;
  match_count?: number;
  conversation_count?: number;
}

// Event properties interface
export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// Analytics event interface
export interface AnalyticsEventBody {
  event_name: AnalyticsEvent;
  user_id: string;
  properties?: EventProperties;
  timestamp: string;
  platform: "ios" | "android" | "web";
  app_version: string;
}

/**
 * Analytics servisi
 */
class AnalyticsService {
  private userId: string | null = null;
  private userProperties: UserProperties | null = null;
  private queuedEvents: AnalyticsEventBody[] = [];
  private isDev: boolean = __DEV__;

  constructor() {
    // Eventleri flush et (dakikada bir)
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.flush(), 60000);
    }
  }

  /**
   * Kullanıcıyı set et
   */
  setUser(userId: string, properties?: Partial<UserProperties>) {
    this.userId = userId;
    this.userProperties = {
      user_id: userId,
      ...properties,
    };

    // Kullanıcı properties'lerini logla
    this.track("app_open", {
      ...this.userProperties,
    });
  }

  /**
   * User properties güncelle
   */
  updateUserProperties(properties: Partial<UserProperties>) {
    if (this.userProperties) {
      this.userProperties = {
        ...this.userProperties,
        ...properties,
      };
    }
  }

  /**
   * Event track et
   */
  track(eventName: AnalyticsEvent, properties?: EventProperties) {
    if (!this.userId) {
      console.warn("Analytics: User not set. Call setUser() first.");
      return;
    }

    const event: AnalyticsEventBody = {
      event_name: eventName,
      user_id: this.userId,
      properties: {
        ...this.userProperties,
        ...properties,
      },
      timestamp: new Date().toISOString(),
      platform: Platform.OS as "ios" | "android" | "web",
      app_version: "1.0.0", // TODO: Constants'dan al
    };

    // Dev mode'da console'a logla
    if (this.isDev) {
      console.log("Analytics Event:", event);
    }

    // Event'i kuyruğa ekle
    this.queuedEvents.push(event);

    // Kuyruk çok büyükse flush et
    if (this.queuedEvents.length >= 10) {
      this.flush();
    }
  }

  /**
   * Screen view track et
   */
  trackScreenView(screenName: string, properties?: EventProperties) {
    this.track("screen_view", {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Eventleri Supabase'e gönder (flush)
   */
  private async flush() {
    if (this.queuedEvents.length === 0) {
      return;
    }

    const eventsToSend = [...this.queuedEvents];
    this.queuedEvents = [];

    try {
      // Analytics tablosuna event'leri insert et
      // Önce tablo yoksa sessizce fail et
      await supabase.from("analytics_events").insert(eventsToSend);

      if (this.isDev) {
        console.log(`Analytics: Flushed ${eventsToSend.length} events`);
      }
    } catch (error) {
      // Hata durumunda event'leri tekrar kuyruğa ekle
      this.queuedEvents.unshift(...eventsToSend);

      if (this.isDev) {
        console.error("Analytics: Flush failed", error);
      }
    }
  }

  /**
   * Tüm eventleri manuel flush et
   */
  async flushNow() {
    await this.flush();
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

/**
 * Convenience fonksiyonlar
 */
export function trackEvent(eventName: AnalyticsEvent, properties?: EventProperties) {
  analytics.track(eventName, properties);
}

export function trackScreenView(screenName: string, properties?: EventProperties) {
  analytics.trackScreenView(screenName, properties);
}

export function setUserForAnalytics(userId: string, properties?: Partial<UserProperties>) {
  analytics.setUser(userId, properties);
}

export function updateUserProperties(properties: Partial<UserProperties>) {
  analytics.updateUserProperties(properties);
}

/**
 * Predefined event trackers
 */
export const AnalyticsEvents = {
  // Post events
  postLike: (postId: string, category?: string) =>
    trackEvent("post_like", { post_id: postId, category }),
  postUnlike: (postId: string) =>
    trackEvent("post_unlike", { post_id: postId }),
  postComment: (postId: string) =>
    trackEvent("post_comment", { post_id: postId }),
  postEdit: (postId: string) =>
    trackEvent("post_edit", { post_id: postId }),
  postDelete: (postId: string) =>
    trackEvent("post_delete", { post_id: postId }),

  // Match events
  swipeLeft: (profileId: string) =>
    trackEvent("swipe_left", { profile_id: profileId }),
  swipeRight: (profileId: string) =>
    trackEvent("swipe_right", { profile_id: profileId }),
  superLike: (profileId: string) =>
    trackEvent("super_like", { profile_id: profileId }),
  match: (matchId: string) =>
    trackEvent("match", { match_id: matchId }),

  // Message events
  messageSend: (conversationId: string) =>
    trackEvent("message_send", { conversation_id: conversationId }),
  conversationOpen: (conversationId: string) =>
    trackEvent("conversation_open", { conversation_id: conversationId }),

  // Profile events
  profileView: (profileId: string) =>
    trackEvent("profile_view", { profile_id: profileId }),

  // Premium events
  premiumView: () =>
    trackEvent("premium_view"),
  premiumUpgradeClick: (plan: "premium" | "gold") =>
    trackEvent("premium_upgrade_click", { plan }),
  premiumUpgradeSuccess: (plan: "premium" | "gold") =>
    trackEvent("premium_upgrade_success", { plan }),
  boostStart: () =>
    trackEvent("boost_start"),
  rewindUse: () =>
    trackEvent("rewind_use"),

  // Filter events
  filterApply: (filters: any) =>
    trackEvent("filter_apply", { filters }),

  // App events
  appOpen: () =>
    trackEvent("app_open"),
};
