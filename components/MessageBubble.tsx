import { View, Text, StyleSheet } from "react-native";
import { Check, CheckCheck } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";
import { Message } from "@/lib/supabase";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.containerOwn : styles.containerOther,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        <Text
          style={[
            styles.content,
            isOwn ? styles.contentOwn : styles.contentOther,
          ]}
        >
          {message.content}
        </Text>
        <View style={styles.meta}>
          <Text
            style={[
              styles.time,
              isOwn ? styles.timeOwn : styles.timeOther,
            ]}
          >
            {time}
          </Text>
          {isOwn &&
            (message.is_read ? (
              <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
            ) : (
              <Check size={14} color="rgba(255,255,255,0.5)" />
            ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
  },
  containerOwn: {
    alignItems: "flex-end",
  },
  containerOther: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  contentOwn: {
    color: colors.white,
  },
  contentOther: {
    color: colors.text,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  time: {
    fontSize: fontSize.xs,
  },
  timeOwn: {
    color: "rgba(255,255,255,0.7)",
  },
  timeOther: {
    color: colors.textMuted,
  },
});
