"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Camera } from "lucide-react";

const MALE_AVATARS = Array.from({ length: 8 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/png?seed=male${i}&backgroundColor=b6e3f4`);
const FEMALE_AVATARS = Array.from({ length: 8 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/png?seed=female${i}&backgroundColor=ffd5dc`);

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);

  // Zorunlu alanlar
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");

  // Opsiyonel alanlar
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");

  // Avatar / Foto
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const avatarOptions = gender === "male" ? MALE_AVATARS : FEMALE_AVATARS;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setSelectedAvatar("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!gender) {
      setError("Lutfen cinsiyet secin");
      return;
    }

    if (!fullName.trim()) {
      setError("Lutfen ad soyad girin");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password, username, gender);
      if (signUpError) {
        setError(signUpError.message || "Kayit olamadi");
        setLoading(false);
        return;
      }

      // Profili guncelle (ek alanlar + avatar)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let avatarUrl = selectedAvatar;

      // Foto yukleme
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

      // Avatar secilmediyse ve foto yuklenmemisse default avatar
      if (!avatarUrl) {
        avatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${username}`;
      }

      const updateData: Record<string, unknown> = {
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
      };

      if (age) updateData.age = parseInt(age);
      if (height) updateData.height = parseInt(height);
      if (city) updateData.city = city.trim();
      if (occupation) updateData.occupation = occupation.trim();

      await supabase.from("profiles").update(updateData).eq("id", user.id);
    } catch {
      setError("Bir hata olustu");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <Logo size={48} />
      <h1 className="text-2xl font-bold mt-6 mb-2 text-[var(--text)]">
        Hesap Olustur
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Entrika&apos;ya katil
      </p>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-8 h-1 rounded-full ${s <= step ? "bg-[var(--primary)]" : "bg-[var(--border-light)]"}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Zorunlu alanlar */}
        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Ad Soyad *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Kullanici adi *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              type="email"
              placeholder="E-posta *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              type="password"
              placeholder="Sifre (en az 6 karakter) *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />

            {/* Gender Selection */}
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-2">Cinsiyet *</p>
              <div className="flex gap-3">
                {[
                  { value: "female", label: "Kadin" },
                  { value: "male", label: "Erkek" },
                  { value: "other", label: "Diger" },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium ${
                      gender === g.value
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-[var(--border-light)] text-[var(--text-muted)] hover:border-[var(--border)]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!fullName || !username || !email || !password || !gender) {
                  setError("Lutfen tum zorunlu alanlari doldurun");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              Devam Et
            </button>
          </>
        )}

        {/* Step 2: Opsiyonel alanlar */}
        {step === 2 && (
          <>
            <p className="text-sm text-[var(--text-muted)]">Bu alanlar opsiyoneldir, daha sonra da doldurabilirsin.</p>
            <input
              type="number"
              placeholder="Yas"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={18}
              max={99}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              type="number"
              placeholder="Boy (cm)"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min={140}
              max={220}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Yasadigin sehir"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Meslek"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-medium border border-[var(--border)] text-[var(--text)]"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                Devam Et
              </button>
            </div>
          </>
        )}

        {/* Step 3: Avatar / Foto secimi */}
        {step === 3 && (
          <>
            <p className="text-sm text-[var(--text-muted)]">Profil fotografi veya avatar sec</p>

            {/* Photo upload */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--card)]">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  ) : selectedAvatar ? (
                    <img src={selectedAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <span className="block text-center text-xs text-[var(--primary)] mt-1">Foto Yukle</span>
              </label>
            </div>

            {/* Avatar grid */}
            {gender && (
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-2">veya avatar sec:</p>
                <div className="grid grid-cols-4 gap-2">
                  {avatarOptions.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => { setSelectedAvatar(url); setPhotoFile(null); setPhotoPreview(null); }}
                      className={`w-full aspect-square rounded-xl overflow-hidden border-2 ${
                        selectedAvatar === url ? "border-[var(--primary)]" : "border-transparent"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl font-medium border border-[var(--border)] text-[var(--text)]"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                {loading ? "Kayit olunuyor..." : "Kayit Ol"}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="mt-6 text-sm text-[var(--text-muted)]">
        Zaten hesabin var mi?{" "}
        <Link
          href="/login"
          className="text-[var(--primary)] font-semibold hover:underline"
        >
          Giris Yap
        </Link>
      </div>
    </div>
  );
}
