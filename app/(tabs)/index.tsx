import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, MessageCircle } from "lucide-react-native";
import {
  MOCK_POSTS,
  CATEGORIES,
  REACTIONS,
  type Post,
  type ReactionType,
} from "@/data/mockData";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";

function PostCard({ post }: { post: Post }) {
  const [revealed, setRevealed] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const category = CATEGORIES[post.category];

  const handleLongPress = () => {
    setShowReactions(true);
  };

  const handleReaction = (type: ReactionType) => {
    setShowReactions(false);
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={styles.postCard}
    >
      {/* Kategori Badge */}
      <View style={styles.postHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: `${category.color}15` }]}>
          <Text style={[styles.categoryText, { color: category.color }]}>
            {category.emoji} {category.label}
          </Text>
        </View>
        <Text style={styles.timeText}>{post.createdAt}</Text>
      </View>

      {/* İçerik */}
      <View style={styles.postContent}>
        <View style={styles.postTextContainer}>
          {post.isSpoiler && !revealed ? (
            <TouchableOpacity onPress={() => setRevealed(true)} activeOpacity={0.8}>
              <View style={styles.spoilerBox}>
                <Text style={styles.spoilerText}>
                  🔒 Hassas içerik{"\n"}
                  <Text style={styles.spoilerSubtext}>Görmek için dokun</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.postText}>{post.content}</Text>
          )}
        </View>

        {post.imageUrl && (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: post.imageUrl }} style={styles.thumbnail} />
          </View>
        )}
      </View>

      {/* Author */}
      {!post.isAnonymous && (
        <View style={styles.authorRow}>
          <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} />
          <Text style={styles.authorName}>@{post.authorName}</Text>
        </View>
      )}

      {/* Reaksiyonlar */}
      <View style={styles.reactionsRow}>
        <View style={styles.reactionsList}>
          {post.reactions.slice(0, 3).map((reaction, index) => (
            <View key={index} style={styles.reactionChip}>
              <Text style={styles.reactionEmoji}>{REACTIONS[reaction.type].emoji}</Text>
              <Text style={styles.reactionCount}>{reaction.count}</Text>
            </View>
          ))}
        </View>
        <View style={styles.commentsContainer}>
          <MessageCircle size={16} color={colors.textMuted} />
          <Text style={styles.commentCount}>{post.commentCount}</Text>
        </View>
      </View>

      {/* Reaksiyon Seçici */}
      {showReactions && (
        <View style={styles.reactionPickerOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowReactions(false)}
          />
          <View style={styles.reactionPicker}>
            {(Object.keys(REACTIONS) as ReactionType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleReaction(type)}
                style={styles.reactionOption}
              >
                <Text style={styles.reactionOptionEmoji}>{REACTIONS[type].emoji}</Text>
                <Text style={styles.reactionOptionLabel}>{REACTIONS[type].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Sparkles size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>ENTRİKA</Text>
        </View>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginLeft: spacing.sm,
    letterSpacing: 1,
  },
  feed: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  feedContent: {
    paddingBottom: spacing.xl,
  },
  bottomSpacer: {
    height: 80,
  },
  postCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  timeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: "auto",
  },
  postContent: {
    flexDirection: "row",
  },
  postTextContainer: {
    flex: 1,
  },
  postText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  spoilerBox: {
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  spoilerText: {
    color: colors.textLight,
    textAlign: "center",
    fontSize: fontSize.sm,
  },
  spoilerSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  thumbnailContainer: {
    marginLeft: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderLight,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
  },
  authorName: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  reactionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  reactionsList: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  reactionEmoji: {
    fontSize: fontSize.sm,
  },
  reactionCount: {
    color: colors.textLight,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  commentsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  reactionPickerOverlay: {
    position: "absolute",
    top: "50%",
    left: spacing.lg,
    right: spacing.lg,
    transform: [{ translateY: -50 }],
  },
  reactionPicker: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  reactionOption: {
    alignItems: "center",
    padding: spacing.sm,
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
  reactionOptionLabel: {
    color: colors.textLight,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
