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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Star } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Message } from "@/lib/supabase";
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
} from "@/lib/messaging";
import MessageBubble from "@/components/MessageBubble";

export default function ChatScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isOwn={item.sender_id === user?.id} />
  );

  return (
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
          onPress={() => {
            if (otherUserId && otherUser) {
              router.push({
                pathname: "/review-user",
                params: { userId: otherUserId, username: otherUser.username },
              });
            }
          }}
          disabled={!otherUserId || !otherUser}
        >
          <Star size={22} color={colors.warning} />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
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
});
