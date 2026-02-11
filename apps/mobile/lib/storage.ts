import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";
import { supabase } from "./supabase";

type Bucket = "avatars" | "dating-photos" | "post-images";

interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  source?: "gallery" | "camera";
}

export async function pickImage(
  options: PickImageOptions = {}
): Promise<string | null> {
  const {
    allowsEditing = true,
    aspect = [1, 1],
    quality = 0.8,
    source = "gallery",
  } = options;

  // Request permissions (skip on web - permissions work differently)
  if (Platform.OS !== "web") {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Gerekli", "Kamera erisimi icin izin vermeniz gerekiyor.");
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Gerekli", "Galeri erisimi icin izin vermeniz gerekiyor.");
        return null;
      }
    }
  }

  const launchFn =
    source === "camera"
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launchFn({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing,
    aspect,
    quality,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return result.assets[0].uri;
}

export async function uploadImage(
  bucket: Bucket,
  userId: string,
  uri: string
): Promise<string> {
  const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}/${Date.now()}.${ext}`;

  // Fetch the image as a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Convert blob to ArrayBuffer for Supabase upload
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
      ? "image/webp"
      : "image/jpeg";

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Fotograf yuklenemedi: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteImage(
  bucket: Bucket,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Fotograf silinemedi: ${error.message}`);
  }
}

export function extractPathFromUrl(url: string, bucket: Bucket): string | null {
  // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export function showImageSourcePicker(
  callback: (source: "gallery" | "camera") => void
): void {
  if (Platform.OS === "web") {
    // Web: Use alert as fallback, component should be used for better UX
    alert("Galeriden fotoğraf seçmek için lütfen ilgili butona tıklayın.");
  } else if (Platform.OS === "ios") {
    // iOS: Use ActionSheetIOS (handled by ImageSourcePicker component)
    Alert.alert("Fotoğraf Seç", "Nereden yüklemek istersin?", [
      { text: "Galeri", onPress: () => callback("gallery") },
      { text: "Kamera", onPress: () => callback("camera") },
      { text: "İptal", style: "cancel" },
    ]);
  } else {
    // Android: Use Alert as fallback
    Alert.alert("Fotoğraf Seç", "Nereden yüklemek istersin?", [
      { text: "Galeri", onPress: () => callback("gallery") },
      { text: "Kamera", onPress: () => callback("camera") },
      { text: "İptal", style: "cancel" },
    ]);
  }
}
