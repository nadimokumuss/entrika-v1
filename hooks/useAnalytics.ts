import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  analytics,
  trackEvent,
  trackScreenView,
  setUserForAnalytics,
  updateUserProperties,
  AnalyticsEvent,
  EventProperties,
  AnalyticsEvents,
} from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * Analytics hook
 * Screen tracking ve event tracking için kullanılır
 */
export function useAnalytics(screenName?: string) {
  const { user } = useAuth();
  const hasTrackedScreen = useRef(false);

  // Kullanıcıyı analytics'e set et
  useEffect(() => {
    if (user && !analytics["userId"]) {
      setUserForAnalytics(user.id, {
        username: user.user_metadata?.username,
        created_at: user.created_at,
      });
    }
  }, [user]);

  // Screen view track et (sadece bir kere)
  useEffect(() => {
    if (screenName && !hasTrackedScreen.current) {
      trackScreenView(screenName);
      hasTrackedScreen.current = true;
    }
  }, [screenName]);

  // Screen her focus olduğunda track et
  useFocusEffect(
    useCallback(() => {
      if (screenName) {
        trackScreenView(screenName, { focus: true });
      }
    }, [screenName])
  );

  // Event track et
  const track = useCallback((eventName: AnalyticsEvent, properties?: EventProperties) => {
    trackEvent(eventName, properties);
  }, []);

  return {
    track,
    AnalyticsEvents,
  };
}

/**
 * Engagement tracker hook
 * Beğeni, eşleşme, mesaj gibi engagement metric'lerini track eder
 */
export function useEngagementTracker() {
  const { user } = useAuth();

  const trackPostLike = useCallback(
    (postId: string, category?: string) => {
      AnalyticsEvents.postLike(postId, category);
    },
    []
  );

  const trackSwipe = useCallback(
    (direction: "left" | "right" | "super", profileId: string) => {
      if (direction === "left") {
        AnalyticsEvents.swipeLeft(profileId);
      } else if (direction === "right") {
        AnalyticsEvents.swipeRight(profileId);
      } else if (direction === "super") {
        AnalyticsEvents.superLike(profileId);
      }
    },
    []
  );

  const trackMatch = useCallback((matchId: string) => {
    AnalyticsEvents.match(matchId);

    // Match count'u güncelle
    if (user) {
      updateUserProperties({ match_count: undefined }); // DB'den fetch et
    }
  }, [user?.id]);

  const trackMessage = useCallback((conversationId: string) => {
    AnalyticsEvents.messageSend(conversationId);
  }, []);

  const trackConversationOpen = useCallback((conversationId: string) => {
    AnalyticsEvents.conversationOpen(conversationId);
  }, []);

  return {
    trackPostLike,
    trackSwipe,
    trackMatch,
    trackMessage,
    trackConversationOpen,
  };
}

/**
 * Performance tracker hook
 * Component render süresi ve diğer performans metriklerini track eder
 */
export function usePerformanceTracker(componentName: string) {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const renderTime = Date.now() - startTime;

      // Sadece yavaş render'ları logla (> 100ms)
      if (renderTime > 100) {
        console.warn(`Slow render: ${componentName} took ${renderTime}ms`);

        trackEvent("slow_render" as AnalyticsEvent, {
          component: componentName,
          render_time: renderTime,
        });
      }
    };
  }, [componentName]);
}

/**
 * Conversion tracker hook
 * Premium upgrade gibi conversion olaylarını track eder
 */
export function useConversionTracker() {
  const trackPremiumView = useCallback(() => {
    AnalyticsEvents.premiumView();
  }, []);

  const trackUpgradeClick = useCallback((plan: "premium" | "gold") => {
    AnalyticsEvents.premiumUpgradeClick(plan);
  }, []);

  const trackUpgradeSuccess = useCallback((plan: "premium" | "gold") => {
    AnalyticsEvents.premiumUpgradeSuccess(plan);

    // User properties'i güncelle
    updateUserProperties({
      is_premium: true,
      premium_plan: plan,
    });
  }, []);

  const trackUpgradeFail = useCallback((plan: "premium" | "gold", reason?: string) => {
    trackEvent("premium_upgrade_fail" as AnalyticsEvent, {
      plan,
      reason,
    });
  }, []);

  const trackBoostStart = useCallback(() => {
    AnalyticsEvents.boostStart();
  }, []);

  const trackRewindUse = useCallback(() => {
    AnalyticsEvents.rewindUse();
  }, []);

  return {
    trackPremiumView,
    trackUpgradeClick,
    trackUpgradeSuccess,
    trackUpgradeFail,
    trackBoostStart,
    trackRewindUse,
  };
}

/**
 * Session tracker hook
 * Oturum süresi ve diğer session metriklerini track eder
 */
export function useSessionTracker() {
  useEffect(() => {
    const sessionStart = Date.now();

    // App open event
    AnalyticsEvents.appOpen();

    return () => {
      // Session end
      const sessionDuration = Date.now() - sessionStart;
      const sessionDurationSeconds = Math.floor(sessionDuration / 1000);

      trackEvent("session_end" as AnalyticsEvent, {
        duration_seconds: sessionDurationSeconds,
      });
    };
  }, []);

  // Sayfa background/foreground tracking
  useEffect(() => {
    const handleBlur = () => {
      trackEvent("app_background" as AnalyticsEvent);
    };

    const handleFocus = () => {
      trackEvent("app_foreground" as AnalyticsEvent);
    };

    // Web için
    if (typeof window !== "undefined") {
      window.addEventListener("blur", handleBlur);
      window.addEventListener("focus", handleFocus);

      return () => {
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, []);
}

/**
 * Error analytics hook
 * Hataları analytics'e track eder
 */
export function useErrorAnalytics() {
  const trackError = useCallback((error: Error, context?: string) => {
    trackEvent("error" as AnalyticsEvent, {
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  }, []);

  const trackNetworkError = useCallback((url: string, method: string) => {
    trackEvent("network_error" as AnalyticsEvent, {
      url,
      method,
    });
  }, []);

  return {
    trackError,
    trackNetworkError,
  };
}
