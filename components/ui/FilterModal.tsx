import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { X, Sliders, MapPin, ChevronDown, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors, borderRadius, spacing, fontSize, gradients, shadows } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  ageMin: number;
  ageMax: number;
  city?: string;
}

const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Gaziantep",
  "Konya",
];

export function FilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
}: FilterModalProps) {
  const [ageMin, setAgeMin] = useState(currentFilters.ageMin);
  const [ageMax, setAgeMax] = useState(currentFilters.ageMax);
  const [city, setCity] = useState(currentFilters.city || "");

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply({ ageMin, ageMax, city: city || undefined });
    onClose();
  };

  const handleReset = () => {
    setAgeMin(18);
    setAgeMax(100);
    setCity("");
  };

  const ageRange = ageMax - ageMin;

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
            <Text style={styles.title}>Filtreler</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Age Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sliders size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Yaş Aralığı</Text>
                <Text style={styles.sectionValue}>{ageMin} - {ageMax}</Text>
              </View>

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>18</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={18}
                  maximumValue={100}
                  step={1}
                  value={ageMin}
                  onValueChange={setAgeMin}
                  minimumTrackTintColor={glass.border}
                  maximumTrackTintColor={colors.primary}
                  thumbTintColor={colors.primary}
                />
                <Slider
                  style={styles.slider}
                  minimumValue={18}
                  maximumValue={100}
                  step={1}
                  value={ageMax}
                  onValueChange={setAgeMax}
                  minimumTrackTintColor={glass.border}
                  maximumTrackTintColor={colors.primary}
                  thumbTintColor={colors.primary}
                />
                <Text style={styles.sliderLabel}>100</Text>
              </View>

              <View style={styles.ageButtons}>
                {[20, 25, 30, 35, 40].map((presetAge) => (
                  <TouchableOpacity
                    key={presetAge}
                    style={[
                      styles.ageButton,
                      ageMin === presetAge && ageMax === presetAge + 5 && styles.ageButtonActive,
                    ]}
                    onPress={() => {
                      setAgeMin(presetAge);
                      setAgeMax(presetAge + 5);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.ageButtonText,
                        ageMin === presetAge && ageMax === presetAge + 5 && styles.ageButtonTextActive,
                      ]}
                    >
                      {presetAge}-{presetAge + 5}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* City Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Şehir</Text>
                {city && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setCity("");
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <X size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.cityScroll}
                contentContainerStyle={styles.cityScrollContent}
              >
                {CITIES.map((cityName) => (
                  <TouchableOpacity
                    key={cityName}
                    style={[
                      styles.cityChip,
                      city === cityName && styles.cityChipActive,
                    ]}
                    onPress={() => {
                      setCity(cityName);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.cityChipText,
                        city === cityName && styles.cityChipTextActive,
                      ]}
                    >
                      {cityName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Bu filtreler, swipe sırasında gösterilecek profillere uygulanır.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Sıfırla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <LinearGradient
                colors={gradients.premiumShimmer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyGradient}
              >
                <Check size={20} color={colors.white} />
                <Text style={styles.applyButtonText}>Uygula</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    borderColor: glassFallback.border,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    padding: spacing.xl,
    maxHeight: 400,
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
  sectionValue: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "bold",
  },
  clearButton: {
    padding: spacing.xs,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  slider: {
    flex: 1,
  },
  sliderLabel: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    width: 30,
    textAlign: "center",
  },
  ageButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ageButton: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ageButtonActive: {
    backgroundColor: `${colors.primary}30`,
    borderColor: colors.primary,
  },
  ageButtonText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  ageButtonTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  cityScroll: {
    marginHorizontal: -spacing.lg,
  },
  cityScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  cityChip: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cityChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  cityChipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  cityChipTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    padding: spacing.xl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textLight,
  },
  applyButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  applyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  applyButtonText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.white,
  },
});
