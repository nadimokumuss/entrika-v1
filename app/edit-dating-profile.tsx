import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Save } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";
import { supabase, type DatingProfile } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const INTERESTS_LIST = [
  "Muzik",
  "Spor",
  "Seyahat",
  "Yemek",
  "Film",
  "Kitap",
  "Oyun",
  "Teknoloji",
  "Sanat",
  "Dans",
  "Yoga",
  "Fotograf",
  "Doga",
  "Kahve",
  "Hayvanlar",
];

const LOOKING_FOR_OPTIONS = [
  { value: "female", label: "Kadin" },
  { value: "male", label: "Erkek" },
  { value: "both", label: "Her ikisi" },
];

export default function EditDatingProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<DatingProfile | null>(null);

  // Form state
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [job, setJob] = useState("");
  const [education, setEducation] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("both");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("dating_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setExistingProfile(data);
        setAge(data.age ? String(data.age) : "");
        setCity(data.city || "");
        setJob(data.job || "");
        setEducation(data.education || "");
        setBio(data.bio || "");
        setInterests(data.interests || []);
        setLookingFor(data.looking_for || "both");
        setIsActive(data.is_active ?? true);
      }
    } catch (error) {
      console.error("Error fetching dating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate age if provided
    if (age.trim() !== "") {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
        Alert.alert("Hata", "Yas 18 ile 99 arasinda olmalidir.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const profileData = {
        user_id: user.id,
        age: age.trim() !== "" ? parseInt(age, 10) : null,
        city: city.trim(),
        job: job.trim() || null,
        education: education.trim() || null,
        bio: bio.trim(),
        interests,
        looking_for: lookingFor,
        is_active: isActive,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from("dating_profiles")
          .update(profileData)
          .eq("id", existingProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("dating_profiles")
          .insert(profileData);
        if (error) throw error;
      }

      router.back();
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Profil kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Dating Profili</Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={submitting}
            style={[styles.saveButton, !submitting && styles.saveButtonActive]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Save size={16} color={colors.white} />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Yas */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Yas</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Orn: 25"
              placeholderTextColor={colors.textMuted}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          {/* Sehir */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Sehir</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Orn: Istanbul"
              placeholderTextColor={colors.textMuted}
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Meslek */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Meslek</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Orn: Yazilim Muhendisi"
              placeholderTextColor={colors.textMuted}
              value={job}
              onChangeText={setJob}
            />
          </View>

          {/* Egitim */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Egitim</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Orn: Istanbul Universitesi"
              placeholderTextColor={colors.textMuted}
              value={education}
              onChangeText={setEducation}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Hakkinda</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              placeholder="Kendinden bahset..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Ilgi Alanlari */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Ilgi Alanlari</Text>
            <View style={styles.chipsContainer}>
              {INTERESTS_LIST.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Looking For */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Aranan Cinsiyet</Text>
            <View style={styles.lookingForContainer}>
              {LOOKING_FOR_OPTIONS.map((option) => {
                const isSelected = lookingFor === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setLookingFor(option.value)}
                    style={[
                      styles.lookingForButton,
                      isSelected && styles.lookingForButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.lookingForText,
                        isSelected && styles.lookingForTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Is Active */}
          <View style={styles.fieldContainer}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.fieldLabel}>Profil Aktif</Text>
                <Text style={styles.switchDescription}>
                  Kapatirsan eslesme ekraninda gorunmezsin
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: "600",
    fontSize: fontSize.lg,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    marginLeft: spacing.sm,
    fontWeight: "500",
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  fieldContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  fieldLabel: {
    color: colors.textLight,
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.base,
  },
  bioInput: {
    minHeight: 100,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: `${colors.primary}15`,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  lookingForContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  lookingForButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  lookingForButtonSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: `${colors.accent}15`,
  },
  lookingForText: {
    fontSize: fontSize.base,
    color: colors.textLight,
    fontWeight: "500",
  },
  lookingForTextSelected: {
    color: colors.accent,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: 80,
  },
});
