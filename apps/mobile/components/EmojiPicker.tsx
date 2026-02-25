import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Pressable,
} from "react-native";
import { SmilePlus } from "lucide-react-native";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { REACTIONS, type ReactionType } from "@/constants/categories";

interface EmojiPickerProps {
  visible: boolean;
  onSelect: (type: ReactionType) => void;
  onClose: () => void;
  activeReaction?: ReactionType | null;
  triggerSize?: number;
  onTriggerPress: () => void;
}

export default function EmojiPicker({
  visible,
  onSelect,
  onClose,
  activeReaction,
  triggerSize = 14,
  onTriggerPress,
}: EmojiPickerProps) {
  const { colors, glass } = useTheme();
  const reactionKeys = Object.keys(REACTIONS) as ReactionType[];
  const anims = useRef(reactionKeys.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // Staggered scale-in animation
      const animations = anims.map((anim, i) =>
        Animated.spring(anim, {
          toValue: 1,
          delay: i * 40,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        })
      );
      Animated.parallel(animations).start();
    } else {
      anims.forEach((anim) => anim.setValue(0));
    }
  }, [visible]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      position: "relative",
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    pickerOverlay: {
      position: "absolute",
      bottom: 36,
      left: -spacing.sm,
      zIndex: 100,
    },
    picker: {
      flexDirection: "row",
      backgroundColor: "rgba(30, 30, 42, 0.95)",
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.xl,
      padding: spacing.sm,
      gap: spacing.xs,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    emojiButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    emojiButtonActive: {
      backgroundColor: `${colors.primary}30`,
    },
    emoji: {
      fontSize: 20,
    },
    backdrop: {
      position: "absolute",
      top: -200,
      left: -200,
      right: -200,
      bottom: -200,
      zIndex: 99,
    },
  }), [colors, glass]);

  return (
    <View style={styles.container}>
      {/* Trigger button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={onTriggerPress}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <SmilePlus size={triggerSize} color={activeReaction ? colors.primary : colors.textMuted} />
      </TouchableOpacity>

      {/* Picker dropdown */}
      {visible && (
        <>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={styles.pickerOverlay}>
            <View style={styles.picker}>
              {reactionKeys.map((type, i) => {
                const isActive = activeReaction === type;
                return (
                  <Animated.View
                    key={type}
                    style={{
                      transform: [{ scale: anims[i] }],
                      opacity: anims[i],
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.emojiButton, isActive && styles.emojiButtonActive]}
                      onPress={() => {
                        onSelect(type);
                        onClose();
                      }}
                    >
                      <Text style={styles.emoji}>{REACTIONS[type].emoji}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </>
      )}
    </View>
  );
}
