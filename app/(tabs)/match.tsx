import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  X,
  Star,
  MapPin,
  Briefcase,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Flag,
  RotateCcw,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { colors, borderRadius, spacing, fontSize, shadows } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  backgroundLight: "rgba(22, 22, 31, 0.4)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchTotalUnreadCount,
  subscribeToAllMessages,
} from "@/lib/messaging";
import Logo from "@/components/Logo";
import { getBlockedUserIds } from "@/lib/blocking";
import GradientBackground from "@/components/ui/GradientBackground";
import AnimatedHeader from "@/components/ui/AnimatedHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { MatchModal } from "@/components/ui/MatchModal";
import { FilterModal } from "@/components/ui/FilterModal";
import type { FilterOptions } from "@/components/ui/FilterModal";
import { PremiumModal } from "@/components/ui/PremiumModal";
import { Filter as FilterIcon, RotateCcw, Zap, Crown } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const RELATIONSHIP_STATUS_LABELS: Record<string, string> = {
  single: "Bekar",
  dating: "İlişkide",
  complicated: "Karmaşık",
  married: "Evli",
  divorced: "Boşanmış",
  widowed: "Dul",
  rather_not_say: "Söylemek İstemiyorum",
};

interface DatingProfileView {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  photos: string[];
  interests: string[];
  job: string | null;
  education: string | null;
  relationship_status: string | null;
  communityScore: number;
  reviewCount: number;
  verifiedProfile: boolean;
  tags: string[];
  lastActive: string;
}

const ProfileCard = memo(function ProfileCard({
  profile,
  isFirst,
  swipe,
  tiltSign,
  onSwipeLeft,
  onSwipeRight,
  onReport,
  ...rest
}: {
  profile: DatingProfileView;
  isFirst: boolean;
  swipe: Animated.ValueXY;
  tiltSign: Animated.Value;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onReport: (profile: DatingProfileView) => void;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return "#EAB308";
    if (score >= 4) return colors.warning;
    return colors.danger;
  }, []);

  const scoreColor = getScoreColor(profile.communityScore);

  const rotate = Animated.multiply(swipe.x, tiltSign).interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const likeOpacity = swipe.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 6, SCREEN_WIDTH / 4],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = swipe.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -SCREEN_WIDTH / 6, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const likeGlowOpacity = swipe.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 8, SCREEN_WIDTH / 4],
    outputRange: [0, 0.1, 0.3],
    extrapolate: "clamp",
  });

  const nopeGlowOpacity = swipe.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -SCREEN_WIDTH / 8, 0],
    outputRange: [0.3, 0.1, 0],
    extrapolate: "clamp",
  });

  const animatedCardStyle = {
    transform: [...swipe.getTranslateTransform(), { rotate }],
  };

  const nextPhoto = () => {
    if (currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const renderCard = () => (
    <View style={styles.card}>
      {/* Photo */}
      <View style={styles.photoContainer}>
        {profile.photos.length > 0 ? (
          <Image
            source={{ uri: profile.photos[currentPhotoIndex] }}
            style={styles.photo}
          />
        ) : (
          <View style={[styles.photo, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.lg }}>Fotoğraf yok</Text>
          </View>
        )}

        {/* Photo Navigation */}
        <View style={styles.photoNavigation}>
          <TouchableOpacity
            style={styles.photoNavButton}
            onPress={prevPhoto}
            activeOpacity={0.7}
          >
            {currentPhotoIndex > 0 && (
              <ChevronLeft size={24} color={colors.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.photoNavButton}
            onPress={nextPhoto}
            activeOpacity={0.7}
          >
            {currentPhotoIndex < profile.photos.length - 1 && (
              <ChevronRight size={24} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Photo Indicators */}
        {profile.photos.length > 1 && (
          <View style={styles.photoIndicators}>
            {profile.photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.photoIndicator,
                  index === currentPhotoIndex && styles.photoIndicatorActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Report Flag */}
        <TouchableOpacity
          style={styles.reportFlag}
          onPress={() => onReport(profile)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Flag size={18} color={colors.white} />
        </TouchableOpacity>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />

        {/* Like/Nope Glow Effects */}
        <Animated.View style={[styles.glow, styles.likeGlow, { opacity: likeGlowOpacity }]} />
        <Animated.View style={[styles.glow, styles.nopeGlow, { opacity: nopeGlowOpacity }]} />

        {/* Like/Nope Stamps */}
        {isFirst && (
          <>
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Heart size={28} color={colors.success} />
              <Text style={styles.likeStampText}>BEĞENDİM</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <X size={28} color={colors.danger} />
              <Text style={styles.nopeStampText}>GEÇ</Text>
            </Animated.View>
          </>
        )}

        {/* Basic Info on Photo */}
        <View style={styles.photoInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}{profile.age ? `, ${profile.age}` : ""}
            </Text>
            {profile.verifiedProfile && (
              <Shield size={20} color={colors.primary} style={styles.verifiedIcon} />
            )}
          </View>
          <View style={styles.locationRow}>
            {profile.city && (
              <>
                <MapPin size={14} color={colors.white} />
                <Text style={styles.location}>{profile.city}</Text>
              </>
            )}
            {profile.job && (
              <>
                {profile.city && <Text style={styles.locationDivider}>•</Text>}
                <Briefcase size={14} color={colors.white} />
                <Text style={styles.location}>{profile.job}</Text>
              </>
            )}
          </View>
          {profile.relationship_status && (
            <View style={styles.relationshipStatusBadge}>
              <Text style={styles.relationshipStatusText}>
                {RELATIONSHIP_STATUS_LABELS[profile.relationship_status] || "Bekar"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Profile Details */}
      <View style={styles.details}>
        {/* Community Score */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Topluluk Puanı</Text>
            {profile.communityScore < 4 && (
              <View style={styles.warningBadge}>
                <AlertTriangle size={12} color={colors.danger} />
                <Text style={styles.warningText}>Dikkat</Text>
              </View>
            )}
          </View>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}15` }]}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {profile.communityScore.toFixed(1)}
              </Text>
              <Text style={[styles.scoreMax, { color: scoreColor }]}>/10</Text>
            </View>
            <Text style={styles.reviewCount}>
              {profile.reviewCount} değerlendirme
            </Text>
          </View>

          {/* Tags */}
          {profile.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {profile.tags.map((tag, index) => {
                const isNegative = ["Manipülatif", "Agresif", "Dikkat!", "Aldatıcı", "Yalancı", "Belirsiz", "Geç cevap"].includes(tag);
                return (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: isNegative ? `${colors.danger}15` : `${colors.success}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: isNegative ? colors.danger : colors.success },
                      ]}
                    >
                      {tag}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bio */}
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (isFirst) {
    return (
      <Animated.View style={[styles.cardContainer, animatedCardStyle]} {...rest}>
        {renderCard()}
      </Animated.View>
    );
  }

  return <View style={styles.cardContainer}>{renderCard()}</View>;
});

export default function MatchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<DatingProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [matchModal, setMatchModal] = useState(false);
  const [matchData, setMatchData] = useState<{
    id: string;
    name: string;
    age?: number;
    avatar_url?: string;
    username: string;
  } | null>(null);
  const [filterModal, setFilterModal] = useState(false);
  const [premiumModal, setPremiumModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    ageMin: 18,
    ageMax: 100,
    city: undefined,
  });
  const [lastSwipedProfile, setLastSwipedProfile] = useState<DatingProfileView | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<"left" | "right" | null>(null);
  const [error, setError] = useState<{ type: "network" | "server" | "general"; message?: string } | null>(null);
  const swipe = useRef(new Animated.ValueXY()).current;
  const tiltSign = useRef(new Animated.Value(1)).current;

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      // Get already swiped user IDs
      const { data: swipedData } = await supabase
        .from("swipes")
        .select("swiped_id")
        .eq("swiper_id", user.id);

      const swipedIds = (swipedData || []).map((s) => s.swiped_id);
      // Also exclude own profile
      swipedIds.push(user.id);

      // Exclude blocked users
      const blockedIds = await getBlockedUserIds(user.id);
      blockedIds.forEach((id) => {
        if (!swipedIds.includes(id)) swipedIds.push(id);
      });

      // Fetch active dating profiles, excluding already swiped ones
      let query = supabase
        .from("dating_profiles")
        .select("*, profiles(username, avatar_url, reputation_score, is_verified)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      // Get blocked user IDs
      const blockedIds = user ? await getBlockedUserIds(user.id) : [];

      // Exclude swiped users
      const excludeIds = [...swipedIds];
      // Also exclude blocked users
      if (blockedIds.length > 0) {
        excludeIds.push(...blockedIds);
      }

      if (excludeIds.length > 0) {
        query = query.not("user_id", "in", `(${excludeIds.join(",")})`);
      }

      // Apply filters
      if (filters.ageMin > 18 || filters.ageMax < 100) {
        // Calculate birth year range
        const currentYear = new Date().getFullYear();
        const maxBirthYear = currentYear - filters.ageMin;
        const minBirthYear = currentYear - filters.ageMax;

        query = query
          .gte("birth_year", minBirthYear)
          .lte("birth_year", maxBirthYear);
      }

      if (filters.city) {
        query = query.ilike("city", `%${filters.city}%`);
      }

      const { data: datingData, error: datingError } = await query;

      if (datingError) throw datingError;
      if (!datingData || datingData.length === 0) {
        setProfiles([]);
        return;
      }

      // Fetch shadow review scores for these users (via their shadow profiles)
      // For now, use reputation_score from profiles as community score
      const result: DatingProfileView[] = datingData.map((dp: any) => {
        const profileInfo = dp.profiles;
        return {
          id: dp.id,
          user_id: dp.user_id,
          name: profileInfo?.username || "Kullanıcı",
          age: dp.age,
          city: dp.city,
          bio: dp.bio,
          photos: dp.photos || [],
          interests: dp.interests || [],
          job: dp.job,
          education: dp.education,
          relationship_status: dp.relationship_status || "single",
          communityScore: profileInfo?.reputation_score || 5.0,
          reviewCount: 0,
          verifiedProfile: profileInfo?.is_verified || false,
          tags: [],
          lastActive: dp.updated_at || dp.created_at,
        };
      });

      setProfiles(result);
    } catch (error: any) {
      console.error("Error fetching dating profiles:", error);
      if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
        setError({ type: "network" });
      } else if (error?.code?.startsWith("5")) {
        setError({ type: "server" });
      } else {
        setError({ type: "general", message: error?.message });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Fetch unread count on focus
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    const count = await fetchTotalUnreadCount(user.id);
    setUnreadCount(count);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount])
  );

  // Realtime badge update
  useEffect(() => {
    const channel = subscribeToAllMessages(() => {
      loadUnreadCount();
    });
    return () => {
      channel.unsubscribe();
    };
  }, [loadUnreadCount]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy, y0 }) => {
        swipe.setValue({ x: dx, y: dy });
        tiltSign.setValue(y0 > SCREEN_HEIGHT / 2 ? 1 : -1);
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        const isActionActive = Math.abs(dx) > SWIPE_THRESHOLD;

        if (isActionActive) {
          const direction = dx > 0 ? 1 : -1;
          const isLike = direction > 0;
          Animated.timing(swipe, {
            toValue: { x: direction * SCREEN_WIDTH * 1.5, y: dy },
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            handleSwipeComplete(isLike, false);
          });
        } else {
          Animated.spring(swipe, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleSwipeComplete = async (isLike: boolean, isSuperLike: boolean) => {
    if (!user || profiles.length === 0) return;
    const currentProfile = profiles[0];

    // Save last swiped profile for rewind functionality
    setLastSwipedProfile(currentProfile);
    setLastSwipeDirection(isLike ? "right" : "left");

    // Save swipe to Supabase
    try {
      await supabase.from("swipes").insert({
        swiper_id: user.id,
        swiped_id: currentProfile.user_id,
        is_like: isLike,
        is_super_like: isSuperLike,
      });

      // Check if there's a match
      const { data: matchCheck } = await supabase
        .from("swipes")
        .select("swiper_id, swiped_id, is_like")
        .eq("swiper_id", currentProfile.user_id)
        .eq("swiped_id", user.id)
        .eq("is_like", true)
        .single();

      if (matchCheck && isLike) {
        // Match created! Show modal
        setMatchData({
          id: currentProfile.user_id,
          name: currentProfile.name,
          age: currentProfile.age,
          avatar_url: currentProfile.photos[0],
          username: currentProfile.username,
        });
        setMatchModal(true);
      }
    } catch (error) {
      console.error("Error saving swipe:", error);
    }

    setProfiles((prev) => prev.slice(1));
    swipe.setValue({ x: 0, y: 0 });
  };

  const handleRewind = async () => {
    // For now, show premium modal for rewind
    setPremiumModal(true);

    // TODO: Implement actual rewind logic with premium check
    // if (lastSwipedProfile && lastSwipeDirection) {
    //   // Remove swipe from database
    //   await supabase.from("swipes").delete().eq("swiper_id", user.id).eq("swiped_id", lastSwipedProfile.user_id);
    //   // Add profile back to the list
    //   setProfiles((prev) => [lastSwipedProfile, ...prev]);
    //   setLastSwipedProfile(null);
    //   setLastSwipeDirection(null);
    // }
  };

  const handleBoost = () => {
    // For now, show premium modal for boost
    setPremiumModal(true);

    // TODO: Implement actual boost logic with premium check
  };

  const handleSwipeLeft = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(swipe, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeComplete(false, false);
    });
  };

  const handleSwipeRight = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(swipe, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeComplete(true, false);
    });
  };

  const handleSuperLike = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(swipe, {
      toValue: { x: 0, y: -SCREEN_HEIGHT },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeComplete(true, true);
    });
  };

  const handleReport = (profile: DatingProfileView) => {
    router.push({
      pathname: "/report-content",
      params: {
        type: "user",
        targetId: profile.user_id,
        targetName: profile.name,
      },
    });
  };

  if (loading) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <AnimatedHeader style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Logo size={28} />
              <View>
                <Text style={styles.headerTitle}>Eşleşmeler</Text>
                <Text style={styles.headerSubtitle}>Tanışmadan önce tanı</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setFilterModal(true)}
              >
                <FilterIcon size={24} color={colors.primary} />
                {(filters.ageMin !== 18 || filters.ageMax !== 100 || filters.city) && (
                  <View style={styles.filterBadge} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => router.push("/conversations")}
              >
                <MessageCircle size={24} color={colors.primary} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </AnimatedHeader>
          <View style={styles.loadingContainer}>
            {error ? (
              <ErrorState
                type={error.type}
                message={error.message}
                onRetry={() => fetchProfiles()}
              />
            ) : (
              <ActivityIndicator size="large" color={colors.primary} />
            )}
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <AnimatedHeader style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Logo size={28} />
            <View>
              <Text style={styles.headerTitle}>Eşleşmeler</Text>
              <Text style={styles.headerSubtitle}>Tanışmadan önce tanı</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => fetchProfiles()}
              disabled={loading}
            >
              <RotateCcw size={24} color={loading ? colors.textMuted : colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setFilterModal(true)}
            >
              <FilterIcon size={24} color={colors.primary} />
              {(filters.ageMin !== 18 || filters.ageMax !== 100 || filters.city) && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => router.push("/conversations")}
            >
              <MessageCircle size={24} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </AnimatedHeader>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          {error ? (
            <ErrorState
              type={error.type}
              message={error.message}
              onRetry={() => fetchProfiles()}
            />
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : profiles.length > 0 ? (
            profiles
              .slice(0, 2)
              .reverse()
              .map((profile, index) => {
                const isFirst = index === profiles.slice(0, 2).length - 1;
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    isFirst={isFirst}
                    swipe={swipe}
                    tiltSign={tiltSign}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    onReport={handleReport}
                    {...(isFirst ? panResponder.panHandlers : {})}
                  />
                );
              })
          ) : (
            <EmptyState type="match" />
          )}
        </View>

        {/* Action Buttons */}
        {profiles.length > 0 && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.nopeButton]}
              onPress={handleSwipeLeft}
            >
              <X size={28} color={colors.danger} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.superLikeButton]}
              onPress={handleSuperLike}
            >
              <Star size={24} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={handleSwipeRight}
            >
              <Heart size={28} color={colors.success} />
            </TouchableOpacity>
          </View>
        )}

        {/* Premium Actions */}
        {profiles.length > 0 && (
          <View style={styles.premiumActions}>
            <TouchableOpacity
              style={[styles.premiumButton, lastSwipedProfile ? styles.premiumButtonActive : styles.premiumButtonInactive]}
              onPress={handleRewind}
              disabled={!lastSwipedProfile}
            >
              <RotateCcw size={20} color={lastSwipedProfile ? colors.primary : colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.premiumButton}
              onPress={handleBoost}
            >
              <Zap size={20} color={colors.warning} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Match Modal */}
      <MatchModal
        visible={matchModal}
        matchData={matchData}
        onClose={() => setMatchModal(false)}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModal}
        onClose={() => setFilterModal(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
        }}
        currentFilters={filters}
      />

      {/* Premium Modal */}
      <PremiumModal
        visible={premiumModal}
        onClose={() => setPremiumModal(false)}
        onUpgrade={(plan) => {
          // TODO: Implement payment flow
          console.log("Upgrade to:", plan);
        }}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.sm,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  messageButton: {
    padding: spacing.sm,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.accent,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  cardContainer: {
    position: "absolute",
    width: SCREEN_WIDTH - spacing.md * 2,
  },
  card: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  photoContainer: {
    height: 340,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.borderLight,
  },
  photoNavigation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },
  photoNavButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  photoIndicators: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: spacing.xs,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: colors.white,
  },
  reportFlag: {
    position: "absolute",
    top: spacing.md + 12,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  stamp: {
    position: "absolute",
    top: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 3,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.card}90`,
  },
  likeStamp: {
    right: spacing.lg,
    borderColor: colors.success,
    transform: [{ rotate: "15deg" }],
  },
  nopeStamp: {
    left: spacing.lg,
    borderColor: colors.danger,
    transform: [{ rotate: "-15deg" }],
  },
  likeStampText: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
  nopeStampText: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
  glow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
  },
  likeGlow: {
    backgroundColor: colors.success,
  },
  nopeGlow: {
    backgroundColor: colors.danger,
  },
  photoInfo: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "bold",
  },
  verifiedIcon: {
    marginLeft: spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  location: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  locationDivider: {
    color: colors.white,
    marginHorizontal: spacing.sm,
  },
  relationshipStatusBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.accent}40`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  relationshipStatusText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  details: {
    padding: spacing.lg,
    backgroundColor: glassFallback.background,
  },
  scoreSection: {
    marginBottom: spacing.md,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  scoreTitle: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.danger}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  warningText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  scoreValue: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
  },
  scoreMax: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  reviewCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.md,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  bio: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  interestChip: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  interestText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  nopeButton: {
    borderWidth: 2,
    borderColor: colors.danger,
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: colors.success,
    ...shadows.glow,
  },
  premiumActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  premiumButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
  },
  premiumButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  premiumButtonInactive: {
    opacity: 0.5,
  },
});
