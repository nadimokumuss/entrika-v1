import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Image,
  Platform,
  Alert,
  Linking,
} from "react-native";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageLightboxProps {
  visible: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export function ImageLightbox({
  visible,
  onClose,
  images,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const positionX = useRef(new Animated.Value(0)).current;
  const positionY = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleDoubleTap = () => {
    if (scale === 1) {
      // Zoom in
      setScale(2);
      Animated.spring(scaleAnim, {
        toValue: 2,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset
      setScale(1);
      setPosition({ x: 0, y: 0 });
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(positionX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(positionY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleSave = async () => {
    try {
      if (Platform.OS === "web") {
        // Web: Download image using link
        const link = document.createElement("a");
        link.href = currentImage;
        link.download = `entrika-image-${Date.now()}.jpg`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Native: Open image in browser for user to save
        await Linking.openURL(currentImage);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Image save error:", error);
      Alert.alert("Hata", "Fotoğraf açılamadı.");
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === "web") {
        // Web: Copy link to clipboard
        await navigator.clipboard.writeText(currentImage);
        Alert.alert("Başarılı", "Fotoğraf linki kopyalandı!");
      } else {
        // Native: Open share options
        await Linking.openURL(currentImage);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Hata", "Paylaşım başarısız oldu.");
    }
  };

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft
                size={28}
                color={currentIndex === 0 ? colors.textMuted : colors.white}
              />
            </TouchableOpacity>

            <Text style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNext}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight
                size={28}
                color={currentIndex === images.length - 1 ? colors.textMuted : colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={28} color={colors.white} />
          </TouchableOpacity>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Animated.View
              style={[
                styles.imageWrapper,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateX: positionX },
                    { translateY: positionY },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: currentImage }}
                style={styles.image}
                resizeMode="contain"
                onLoad={() => {
                  // Reset position on new image load
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                  Animated.parallel([
                    Animated.spring(scaleAnim, {
                      toValue: 1,
                      useNativeDriver: true,
                    }),
                    Animated.spring(positionX, {
                      toValue: 0,
                      useNativeDriver: true,
                    }),
                    Animated.spring(positionY, {
                      toValue: 0,
                      useNativeDriver: true,
                    }),
                  ]).start();
                }}
              />
            </Animated.View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={handleSave}
            >
              <Download size={22} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerButton}
              onPress={handleShare}
            >
              <Share2 size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.xl,
  },
  navButton: {
    padding: spacing.sm,
  },
  counter: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.white,
  },
  closeButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.xl,
    padding: spacing.sm,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    position: "absolute",
    bottom: spacing.xl,
    left: 0,
    right: 0,
  },
  footerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
