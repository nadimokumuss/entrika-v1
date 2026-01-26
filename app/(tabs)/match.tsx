import { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
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
} from "lucide-react-native";
import { MOCK_DATING_PROFILES, type DatingProfile } from "@/data/mockData";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

function ProfileCard({
  profile,
  isFirst,
  swipe,
  tiltSign,
  onSwipeLeft,
  onSwipeRight,
  ...rest
}: {
  profile: DatingProfile;
  isFirst: boolean;
  swipe: Animated.ValueXY;
  tiltSign: Animated.Value;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return "#EAB308";
    if (score >= 4) return colors.warning;
    return colors.danger;
  };

  const scoreColor = getScoreColor(profile.communityScore);

  const rotate = Animated.multiply(swipe.x, tiltSign).interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const likeOpacity = swipe.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = swipe.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
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
        <Image
          source={{ uri: profile.photos[currentPhotoIndex] }}
          style={styles.photo}
        />

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

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />

        {/* Like/Nope Stamps */}
        {isFirst && (
          <>
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={styles.likeStampText}>BEĞENDİM</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeStampText}>GEÇ</Text>
            </Animated.View>
          </>
        )}

        {/* Basic Info on Photo */}
        <View style={styles.photoInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            {profile.verifiedProfile && (
              <Shield size={20} color={colors.primary} style={styles.verifiedIcon} />
            )}
          </View>
          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.white} />
            <Text style={styles.location}>{profile.city}</Text>
            {profile.job && (
              <>
                <Text style={styles.locationDivider}>•</Text>
                <Briefcase size={14} color={colors.white} />
                <Text style={styles.location}>{profile.job}</Text>
              </>
            )}
          </View>
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
        </View>

        {/* Bio */}
        <Text style={styles.bio}>{profile.bio}</Text>

        {/* Interests */}
        <View style={styles.interestsContainer}>
          {profile.interests.map((interest, index) => (
            <View key={index} style={styles.interestChip}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
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
}

export default function MatchScreen() {
  const [profiles, setProfiles] = useState(MOCK_DATING_PROFILES);
  const swipe = useRef(new Animated.ValueXY()).current;
  const tiltSign = useRef(new Animated.Value(1)).current;

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
          Animated.timing(swipe, {
            toValue: { x: direction * SCREEN_WIDTH * 1.5, y: dy },
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setProfiles((prev) => prev.slice(1));
            swipe.setValue({ x: 0, y: 0 });
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

  const handleSwipeLeft = () => {
    Animated.timing(swipe, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setProfiles((prev) => prev.slice(1));
      swipe.setValue({ x: 0, y: 0 });
    });
  };

  const handleSwipeRight = () => {
    Animated.timing(swipe, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setProfiles((prev) => prev.slice(1));
      swipe.setValue({ x: 0, y: 0 });
    });
  };

  const handleSuperLike = () => {
    Animated.timing(swipe, {
      toValue: { x: 0, y: -SCREEN_HEIGHT },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setProfiles((prev) => prev.slice(1));
      swipe.setValue({ x: 0, y: 0 });
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eşleşmeler</Text>
        <Text style={styles.headerSubtitle}>Tanışmadan önce tanı</Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {profiles.length > 0 ? (
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
                  {...(isFirst ? panResponder.panHandlers : {})}
                />
              );
            })
        ) : (
          <View style={styles.emptyState}>
            <Heart size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Profil kalmadı!</Text>
            <Text style={styles.emptySubtitle}>
              Yeni profiller için daha sonra tekrar kontrol et.
            </Text>
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 3,
    borderRadius: borderRadius.md,
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
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  nopeStampText: {
    color: colors.danger,
    fontSize: fontSize.xl,
    fontWeight: "bold",
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
  details: {
    padding: spacing.lg,
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
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
  },
});
