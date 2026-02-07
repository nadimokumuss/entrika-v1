import React, { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Pressable } from "react-native";
import { ActionSheetIOS } from "react-native";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type ImageSource = "gallery" | "camera";
type Callback = (source: ImageSource) => void;

interface ImageSourcePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: ImageSource) => void;
}

export function showImageSourcePicker(callback: Callback): void {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["İptal", "Galeri", "Kamera"],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) callback("gallery");
        if (buttonIndex === 2) callback("camera");
      }
    );
  } else {
    // For Android and Web, the component should be used directly
    // This is a fallback - ideally use the component
    console.warn("showImageSourcePicker: Use ImageSourcePicker component on Android/Web");
  }
}

export default function ImageSourcePicker({ visible, onClose, onSelect }: ImageSourcePickerProps) {
  const { colors, glass } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: colors.cardElevated,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      paddingBottom: Platform.OS === "web" ? spacing.xl : spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    header: {
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },
    options: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    option: {
      flex: 1,
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      alignItems: "center",
    },
    optionIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    optionText: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    optionSubtext: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      textAlign: "center",
    },
    cancelButton: {
      backgroundColor: colors.borderLight,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.xl,
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
  }), [colors, glass]);

  // iOS uses native ActionSheet
  if (Platform.OS === "ios") {
    return null;
  }

  const handleSelect = (source: ImageSource) => {
    onSelect(source);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Fotoğraf Seç</Text>
            <Text style={styles.subtitle}>Nereden yüklemek istersin?</Text>
          </View>

          <View style={styles.options}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect("gallery")}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconContainer}>
                <ImageIcon size={28} color={colors.primary} />
              </View>
              <Text style={styles.optionText}>Galeri</Text>
              <Text style={styles.optionSubtext}>Telefonundan seç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect("camera")}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconContainer}>
                <Camera size={28} color={colors.primary} />
              </View>
              <Text style={styles.optionText}>Kamera</Text>
              <Text style={styles.optionSubtext}>Yeni fotoğraf çek</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
