import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Star,
  Flag,
  ShieldBan,
  Unlink,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors, borderRadius, spacing, fontSize, glass } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Message } from "@/lib/supabase";
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
} from "@/lib/messaging";
import { blockUser } from "@/lib/blocking";
import MessageBubble from "@/components/MessageBubble";
import GradientBackground from "@/components/ui/GradientBackground";

export default function ChatScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [otherUser, setOtherUser] = useState<{
    username: string;
    avatar_url: string;
  } | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Load other user info from match
  const loadOtherUser = useCallback(async () => {
    if (!user || !matchId) return;
    const { data: match } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .eq("id", matchId)
      .single();

    if (!match) return;

    const otherId =
      match.user1_id === user.id ? match.user2_id : match.user1_id;
    setOtherUserId(otherId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", otherId)
      .single();

    if (profile) {
      setOtherUser(profile);
    }
  }, [user, matchId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!matchId) return;
    const data = await fetchMessages(matchId);
    setMessages(data);
    setLoading(false);
  }, [matchId]);

  // Mark messages as read
  const markRead = useCallback(async () => {
    if (!user || !matchId) return;
    await markMessagesAsRead(matchId, user.id);
  }, [user, matchId]);

  useEffect(() => {
    loadOtherUser();
    loadMessages();
  }, [loadOtherUser, loadMessages]);

  // Mark as read when screen opens and when new messages arrive
  useEffect(() => {
    if (!loading) {
      markRead();
    }
  }, [loading, markRead]);

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return;

    const channel = subscribeToMessages(matchId, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      // Mark as read if the message is from the other user
      if (user && newMessage.sender_id !== user.id) {
        markRead();
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [matchId, user, markRead]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !matchId || sending) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = inputText.trim();
    setInputText("");
    setSending(true);

    const result = await sendMessage(matchId, user.id, text);
    if (result) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.id)) return prev;
        return [...prev, result];
      });
    }
    setSending(false);
  };

  const handleReview = () => {
    setShowMenu(false);
    if (otherUserId && otherUser) {
      router.push({
        pathname: "/review-user",
        params: { userId: otherUserId, username: otherUser.username },
      });
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    if (otherUserId && otherUser) {
      router.push({
        pathname: "/report-content",
        params: {
          type: "user",
          targetId: otherUserId,
          targetName: `@${otherUser.username}`,
        },
      });
    }
  };

  const handleBlock = () => {
    setShowMenu(false);
    if (!user || !otherUserId || !otherUser) return;
    Alert.alert(
      "Kullaniciyi Engelle",
      `@${otherUser.username} adli kullaniciyi engellemek istediginize emin misiniz?`,
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Engelle",
          style: "destructive",
          onPress: async () => {
            const success = await blockUser(user.id, otherUserId);
            if (success) {
              Alert.alert("Engellendi", `@${otherUser.username} engellendi.`);
              router.back();
            } else {
              Alert.alert("Hata", "Kullanici engellenemedi.");
            }
          },
        },
      ]
    );
  };

  const handleUnmatch = () => {
    setShowMenu(false);
    if (!matchId) return;
    Alert.alert(
      "Eslesmeyi Boz",
      "Bu eslesmeyi bozmak istediginize emin misiniz? Tum mesajlar silinecek.",
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Eslesmeyi Boz",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete messages first
              await supabase.from("messages").delete().eq("match_id", matchId);
              // Delete match
              await supabase.from("matches").delete().eq("id", matchId);
              router.back();
            } catch (error) {
              Alert.alert("Hata", "Eslesme bozmada bir hata olustu.");
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isOwn={item.sender_id === user?.id} />
  );

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          {otherUser && (
            <>
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={styles.headerAvatar}
              />
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUser.username}
              </Text>
            </>
          )}
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => setShowMenu(true)}
          >
            <MoreVertical size={22} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>
                Henuz mesaj yok. Ilk mesaji gonder!
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Mesaj yaz..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim().length > 0 && styles.sendButtonActive,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <Send
                size={20}
                color={
                  inputText.trim().length > 0 ? colors.white : colors.textMuted
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Chat Menu Modal */}
        <Modal visible={showMenu} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleReview}>
                <Star size={20} color={colors.warning} />
                <Text style={styles.menuItemText}>Degerlendir</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                <Flag size={20} color={colors.warning} />
                <Text style={styles.menuItemText}>Raporla</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
                <ShieldBan size={20} color={colors.danger} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>
                  Engelle
                </Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleUnmatch}>
                <Unlink size={20} color={colors.danger} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>
                  Eslesmeyi Boz
                </Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowMenu(false)}
              >
                <Text style={[styles.menuItemText, { color: colors.textMuted, textAlign: "center" }]}>
                  Iptal
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: glass.background,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  headerName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  headerRight: {
    padding: spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  emptyChatText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: "center",
  },
  messageList: {
    paddingVertical: spacing.md,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: glass.background,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: glass.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: glass.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  // Menu modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  menuContainer: {
    width: "100%",
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  menuItemText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: glass.border,
  },
});
