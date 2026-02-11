import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { Search, X, Clock, Hash, User, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  borderRadius,
  spacing,
  fontSize,
  shadows,
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

interface SearchResult {
  id: string;
  type: "user" | "post" | "hashtag";
  title: string;
  subtitle?: string;
  avatar_url?: string;
  username?: string;
  category?: string;
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

// Debounce utility
function debounce(func: Function, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const SEARCH_CATEGORIES = [
  { type: "all", label: "Tumu", icon: Search },
  { type: "users", label: "Kullanicilar", icon: User },
  { type: "posts", label: "Postlar", icon: FileText },
  { type: "hashtags", label: "Hashtagler", icon: Hash },
];

export function SearchModal({ visible, onClose, userId }: SearchModalProps) {
  const { colors, glass } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "users" | "posts" | "hashtags">("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();

  // Fetch recent searches on mount
  useEffect(() => {
    if (visible) {
      // TODO: Fetch from local storage or database
      setRecentSearches([]);
    }
  }, [visible]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        let searchResults: SearchResult[] = [];

        if (selectedCategory === "all" || selectedCategory === "users") {
          // Search users
          const { data: users } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, bio")
            .or(`username.ilike.%${query}%,bio.ilike.%${query}%`)
            .limit(10);

          if (users) {
            searchResults.push(
              ...users.map((u: any) => ({
                id: u.id,
                type: "user" as const,
                title: u.username,
                subtitle: u.bio ? u.bio.substring(0, 50) + "..." : undefined,
                avatar_url: u.avatar_url,
                username: u.username,
              }))
            );
          }
        }

        if (selectedCategory === "all" || selectedCategory === "posts") {
          // Search posts
          const { data: posts } = await supabase
            .from("posts")
            .select("id, content, category, created_at, profiles(username, avatar_url)")
            .or(`content.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .limit(20);

          if (posts) {
            searchResults.push(
              ...posts.map((p: any) => ({
                id: p.id,
                type: "post" as const,
                title: p.content.substring(0, 50) + "...",
                subtitle: new Date(p.created_at).toLocaleDateString("tr-TR"),
                username: p.profiles?.username,
                category: p.category,
              }))
            );
          }
        }

        if (selectedCategory === "all" || selectedCategory === "hashtags") {
          // Extract hashtags from query or search in posts
          const cleanQuery = query.replace("#", "");
          const { data: posts } = await supabase
            .from("posts")
            .select("id, content")
            .filter("content", "ilike", `%#${cleanQuery}%`)
            .limit(10);

          if (posts) {
            const hashtags = new Set<string>();
            posts.forEach((p: any) => {
              const matches = p.content.match(/#[\w]+/g);
              matches?.forEach((tag: string) => hashtags.add(tag));
            });

            searchResults.push(
              ...Array.from(hashtags).map((tag) => ({
                id: tag,
                type: "hashtag" as const,
                title: tag,
                subtitle: "Post etiketi",
              }))
            );
          }
        }

        setResults(searchResults.slice(0, 50));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [selectedCategory]
  );

  // Update search when query changes
  useEffect(() => {
    if (visible && searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, visible, debouncedSearch]);

  const handleResultPress = (result: SearchResult) => {
    // Add to recent searches
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== searchQuery);
      return [searchQuery, ...filtered].slice(0, 5);
    });

    // Navigate based on type
    if (result.type === "user" && result.username) {
      router.push(`/user-profile/${result.id}`);
    } else if (result.type === "post") {
      router.push(`/post-detail?postId=${result.id}`);
    } else if (result.type === "hashtag") {
      // TODO: Navigate to hashtag search results
    }

    onClose();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return User;
      case "post":
        return FileText;
      case "hashtag":
        return Hash;
      default:
        return Search;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "user":
        return colors.primary;
      case "post":
        return colors.accent;
      case "hashtag":
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: glass.border,
      maxHeight: "80%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
      gap: spacing.md,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      height: 44,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
    },
    clearButton: {
      padding: spacing.xs,
    },
    closeButton: {
      padding: spacing.sm,
    },
    categoriesScroll: {
      maxHeight: 50,
    },
    categoriesContent: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: glass.background,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: glass.border,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },
    categoryChipTextActive: {
      color: colors.white,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
    contentScroll: {
      padding: spacing.xl,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
    clearButtonText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: "500",
    },
    recentsContainer: {
      gap: spacing.sm,
    },
    recentItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: glass.background,
      borderRadius: borderRadius.md,
    },
    recentText: {
      fontSize: fontSize.md,
      color: colors.textLight,
    },
    loadingContainer: {
      padding: spacing.xxl,
      alignItems: "center",
    },
    emptyContainer: {
      alignItems: "center",
      padding: spacing.xxl,
    },
    emptyTitle: {
      fontSize: fontSize.xl,
      fontWeight: "bold",
      color: colors.text,
      marginTop: spacing.lg,
    },
    emptySubtitle: {
      fontSize: fontSize.md,
      color: colors.textLight,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    resultItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
      gap: spacing.md,
    },
    resultIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    resultAvatar: {
      width: "100%",
      height: "100%",
    },
    resultContent: {
      flex: 1,
    },
    resultTitle: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
    resultSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      marginTop: 2,
    },
    resultCategory: {
      fontSize: fontSize.xs,
      color: colors.primary,
      marginTop: 4,
      textTransform: "uppercase",
      fontWeight: "bold",
    },
    resultUsername: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: 4,
    },
  }), [colors, glass]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Search size={20} color={colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Kullanici, post, hashtag ara..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchQuery("");
                    setResults([]);
                  }}
                >
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Category Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {SEARCH_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.type}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.type && styles.categoryChipActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync();
                    }
                    setSelectedCategory(cat.type as any);
                  }}
                >
                  <Icon
                    size={16}
                    color={
                      selectedCategory === cat.type
                        ? colors.white
                        : colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat.type && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentScroll}
          >
            {/* Recent Searches */}
            {!searchQuery && recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Clock size={16} color={colors.textLight} />
                  <Text style={styles.sectionTitle}>Son Aramalar</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearButtonText}>Temizle</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentsContainer}>
                  {recentSearches.map((search) => (
                    <TouchableOpacity
                      key={search}
                      style={styles.recentItem}
                      onPress={() => setSearchQuery(search)}
                    >
                      <Clock size={16} color={colors.textMuted} />
                      <Text style={styles.recentText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            {/* Results */}
            {!loading && searchQuery.length >= 2 && results.length === 0 && (
              <View style={styles.emptyContainer}>
                <Search size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Sonuc Bulunamadi</Text>
                <Text style={styles.emptySubtitle}>
                  "{searchQuery}" icin herhangi bir sonuc yok
                </Text>
              </View>
            )}

            {!loading && results.map((result) => {
              const ResultTypeIcon = getTypeIcon(result.type);
              return (
                <TouchableOpacity
                  key={result.id}
                  style={styles.resultItem}
                  onPress={() => handleResultPress(result)}
                >
                  <View
                    style={[
                      styles.resultIcon,
                      { backgroundColor: `${getTypeColor(result.type)}20` },
                    ]}
                  >
                    {result.avatar_url ? (
                      <Image
                        source={{ uri: result.avatar_url }}
                        style={styles.resultAvatar}
                      />
                    ) : (
                      <ResultTypeIcon size={20} color={getTypeColor(result.type)} />
                    )}
                  </View>

                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle}>{result.title}</Text>
                    {result.subtitle && (
                      <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                    )}
                    {result.category && (
                      <Text style={styles.resultCategory}>
                        {result.category}
                      </Text>
                    )}
                  </View>

                  {result.username && (
                    <Text style={styles.resultUsername}>@{result.username}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
