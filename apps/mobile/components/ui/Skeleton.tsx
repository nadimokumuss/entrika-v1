import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Animated } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

function useSkeletonStyles() {
  const { colors, glass } = useTheme();

  return useMemo(() => ({
    styles: StyleSheet.create({
      shimmer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
      },

      // Post Card Skeleton
      card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: glass.border,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
      },
      headerText: {
        marginLeft: 12,
        flex: 1,
        gap: 4,
      },
      content: {
        gap: 6,
        marginBottom: 12,
      },
      categoryContainer: {
        alignItems: "flex-start",
      },
      category: {
        borderRadius: 6,
      },

      // Profile Card Skeleton
      profileCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: glass.border,
      },
      avatarContainer: {
        marginBottom: 12,
      },
      avatarRing: {
        width: 72,
        height: 72,
        borderRadius: 36,
        padding: 4,
        backgroundColor: colors.background,
      },
      profileInfo: {
        alignItems: "center",
        marginBottom: 16,
        gap: 4,
      },
      stats: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginBottom: 16,
      },
      statBox: {
        backgroundColor: glass.background,
        borderRadius: 8,
      },
      bioContainer: {
        width: "100%",
        gap: 4,
      },

      // Match Card Skeleton
      matchCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: glass.border,
      },
      matchImage: {
        width: "100%",
      },
      matchInfo: {
        position: "absolute",
        bottom: 20,
        left: 20,
        gap: 4,
      },
    }),
    colors,
  }), [colors, glass]);
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: any;
  variant?: "circle" | "rect" | "text";
}

export function Skeleton({
  width,
  height = 16,
  style,
  variant = "rect",
}: SkeletonProps) {
  const { styles, colors } = useSkeletonStyles();
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const shimmerPosition = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-0.5, 1.5],
  });

  const baseStyle: any = {
    backgroundColor: colors.card,
    overflow: "hidden",
  };

  if (width) baseStyle.width = width;
  baseStyle.height = height;

  if (variant === "circle") {
    baseStyle.borderRadius = height / 2;
  } else if (variant === "text") {
    baseStyle.borderRadius = 4;
    baseStyle.height = 12;
  } else {
    baseStyle.borderRadius = 8;
  }

  return (
    <View style={[baseStyle, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerPosition }],
          },
        ]}
      />
    </View>
  );
}

interface PostCardSkeletonProps {
  style?: any;
}

export function PostCardSkeleton({ style }: PostCardSkeletonProps) {
  const { styles } = useSkeletonStyles();

  return (
    <View style={[styles.card, style]}>
      {/* Header: Avatar + Username */}
      <View style={styles.header}>
        <Skeleton width={40} height={40} variant="circle" />
        <View style={styles.headerText}>
          <Skeleton width={100} height={14} variant="text" />
          <Skeleton width={60} height={12} variant="text" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Skeleton width={"100%"} height={14} variant="text" />
        <Skeleton width={"90%"} height={14} variant="text" />
        <Skeleton width={"70%"} height={14} variant="text" />
      </View>

      {/* Category Tag */}
      <View style={styles.categoryContainer}>
        <Skeleton width={60} height={24} style={styles.category} />
      </View>
    </View>
  );
}

interface ProfileCardSkeletonProps {
  style?: any;
}

export function ProfileCardSkeleton({ style }: ProfileCardSkeletonProps) {
  const { styles } = useSkeletonStyles();

  return (
    <View style={[styles.profileCard, style]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarRing}>
          <Skeleton width={64} height={64} variant="circle" />
        </View>
      </View>

      {/* Name & Info */}
      <View style={styles.profileInfo}>
        <Skeleton width={120} height={18} variant="text" />
        <Skeleton width={80} height={14} variant="text" />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Skeleton width={50} height={40} style={styles.statBox} />
        <Skeleton width={50} height={40} style={styles.statBox} />
        <Skeleton width={50} height={40} style={styles.statBox} />
      </View>

      {/* Bio */}
      <View style={styles.bioContainer}>
        <Skeleton width={"100%"} height={12} variant="text" />
        <Skeleton width={"80%"} height={12} variant="text" />
      </View>
    </View>
  );
}

interface MatchCardSkeletonProps {
  style?: any;
}

export function MatchCardSkeleton({ style }: MatchCardSkeletonProps) {
  const { styles } = useSkeletonStyles();

  return (
    <View style={[styles.matchCard, style]}>
      {/* Image */}
      <Skeleton width={"100%"} height={400} style={styles.matchImage} />

      {/* Info Overlay */}
      <View style={styles.matchInfo}>
        <Skeleton width={100} height={20} variant="text" />
        <Skeleton width={60} height={14} variant="text" />
      </View>
    </View>
  );
}
