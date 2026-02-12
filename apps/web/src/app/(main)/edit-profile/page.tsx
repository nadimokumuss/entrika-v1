"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setAge(profile.age?.toString() || "");
    setHeight(profile.height?.toString() || "");
    setCity(profile.city || "");
    setOccupation(profile.occupation || "");
  }, [profile]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");

    try {
      let avatarUrl = profile?.avatar_url;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `avatars/${user.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, photoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const updateData: Record<string, unknown> = {
        full_name: fullName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      };
      if (age) updateData.age = parseInt(age);
      if (height) updateData.height = parseInt(height);
      if (city) updateData.city = city.trim() || null;
      if (occupation) updateData.occupation = occupation.trim() || null;

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      router.push("/profile");
    } catch {
      setError("Profil güncellenemedi");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="p-1 rounded-lg hover:bg-[var(--card)]">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text)]">Profili Düzenle</h1>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {error && (
          <div className="px-4 py-2 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">{error}</div>
        )}

        {/* Avatar */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--card)] border-2 border-dashed border-[var(--border)]">
              <img
                src={photoPreview || profile?.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${user?.id}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <Camera size={14} className="text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text)]">Ad Soyad</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text)]">Kullanıcı Adı</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text)]">Biyografi</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Yaş</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} min={18} max={99}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Boy (cm)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} min={140} max={220}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Şehir</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Meslek</label>
            <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
