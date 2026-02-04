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
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Save, Plus, Trash2 } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, glass, shadows } from "@/constants/theme";
import GradientBackground from "@/components/ui/GradientBackground";
import GradientButton from "@/components/ui/GradientButton";
import { supabase, type DatingProfile } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { pickImage, uploadImage, deleteImage, extractPathFromUrl, showImageSourcePicker } from "@/lib/storage";

const INTERESTS_LIST = [
  "Müzik",
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
  "Fotoğraf",
  "Doğa",
  "Kahve",
  "Hayvanlar",
];

const LOOKING_FOR_OPTIONS = [
  { value: "female", label: "Kadın" },
  { value: "male", label: "Erkek" },
  { value: "both", label: "Her ikisi" },
];

const MAX_PHOTOS = 6;
const PHOTO_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_GAP = spacing.sm;
const PHOTO_PADDING = spacing.lg;
const PHOTO_WIDTH = (SCREEN_WIDTH - PHOTO_PADDING * 2 - PHOTO_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS;
const PHOTO_HEIGHT = (PHOTO_WIDTH * 4) / 3;

export default function EditDatingProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<DatingProfile | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
        setPhotos(data.photos || []);
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

  const handleAddPhoto = () => {
    if (uploadingPhoto || !user || photos.length >= MAX_PHOTOS) return;
    showImageSourcePicker(async (source) => {
      try {
        const uri = await pickImage({ source, aspect: [3, 4], quality: 0.8 });
        if (!uri) return;

        setUploadingPhoto(true);
        const publicUrl = await uploadImage("dating-photos", user.id, uri);
        setPhotos((prev) => [...prev, publicUrl]);
      } catch (error: any) {
        Alert.alert("Hata", error.message || "Fotoğraf yüklenemedi.");
      } finally {
        setUploadingPhoto(false);
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    const url = photos[index];
    Alert.alert("Fotoğrafı Sil", "Bu fotoğrafı silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const path = extractPathFromUrl(url, "dating-photos");
            if (path) {
              await deleteImage("dating-photos", path).catch(() => {});
            }
            setPhotos((prev) => prev.filter((_, i) => i !== index));
          } catch (error: any) {
            Alert.alert("Hata", error.message || "Fotoğraf silinemedi.");
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!user || uploadingPhoto) return;

    // Validate age if provided
    if (age.trim() !== "") {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
        Alert.alert("Hata", "Yaş 18 ile 99 arasında olmalıdır.");
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
        photos,
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
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="screen">
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
              disabled={submitting || uploadingPhoto}
              style={[styles.saveButton, !submitting && !uploadingPhoto && styles.saveButtonActive]}
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
            {/* Fotoğraflar */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Fotoğraflar ({photos.length}/{MAX_PHOTOS})</Text>
              <View style={styles.photoGrid}>
                {photos.map((url, index) => (
                  <View key={url} style={styles.photoItem}>
                    <Image source={{ uri: url }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoDeleteButton}
                      onPress={() => handleDeletePhoto(index)}
                    >
                      <Trash2 size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <TouchableOpacity
                    style={styles.photoAddButton}
                    onPress={handleAddPhoto}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Plus size={28} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Yaş */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Yaş</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 25"
                placeholderTextColor={colors.textMuted}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            {/* Şehir */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Şehir</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: İstanbul"
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
                placeholder="Örn: Yazılım Mühendisi"
                placeholderTextColor={colors.textMuted}
                value={job}
                onChangeText={setJob}
              />
            </View>

            {/* Eğitim */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Eğitim</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: İstanbul Üniversitesi"
                placeholderTextColor={colors.textMuted}
                value={education}
                onChangeText={setEducation}
              />
            </View>

            {/* Bio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Hakkında</Text>
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

            {/* İlgi Alanları */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>İlgi Alanları</Text>
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
                    Kapatırsan eşleşme ekranında görünmezsin
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
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: glass.background,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
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
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
  },
  photoItem: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.borderLight,
  },
  photoDeleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddButton: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: glass.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: glass.background,
  },
  textInput: {
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
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
    borderColor: glass.border,
    backgroundColor: glass.background,
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
    borderColor: glass.border,
    backgroundColor: glass.background,
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
