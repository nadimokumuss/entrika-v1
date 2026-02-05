import { View, Text, StyleSheet } from "react-native";
import { Check, CheckCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, spacing, fontSize, gradients } from "@/constants/theme";
import { Message } from "@/lib/supabase";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

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
      {isOwn ? (
        <LinearGradient
          colors={gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleOwn]}
        >
          <Text style={[styles.content, styles.contentOwn]}>
            {message.content}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.time, styles.timeOwn]}>{time}</Text>
            {message.is_read ? (
              <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
            ) : (
              <Check size={14} color="rgba(255,255,255,0.5)" />
            )}
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Text style={[styles.content, styles.contentOther]}>
            {message.content}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.time, styles.timeOther]}>{time}</Text>
          </View>
        </View>
      )}
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
    borderBottomRightRadius: spacing.xs,
  },
  bubbleOther: {
    backgroundColor: glassFallback.background,
    borderBottomLeftRadius: spacing.xs,
    borderWidth: 1,
    borderColor: glassFallback.border,
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
