"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INTERESTS = [
  "Müzik", "Spor", "Seyahat", "Yemek", "Film",
  "Kitap", "Oyun", "Fotoğraf", "Dans", "Yoga",
  "Kamp", "Sanat", "Teknoloji", "Moda", "Doğa",
];

const RELATIONSHIP_OPTIONS = [
  { value: "single", label: "Bekar" },
  { value: "in_relationship", label: "İlişkide" },
  { value: "complicated", label: "Karmaşık" },
  { value: "married", label: "Evli" },
  { value: "divorced", label: "Boşanmış" },
  { value: "widowed", label: "Dul" },
  { value: "open_relationship", label: "Açık İlişki" },
];

export default function EditDatingProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [job, setJob] = useState("");
  const [education, setEducation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("female");
  const [relationshipStatus, setRelationshipStatus] = useState("single");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from("dating_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setBio(data.bio || "");
        setCity(data.city || "");
        setAge(data.age?.toString() || "");
        setJob(data.job || "");
        setEducation(data.education || "");
        setInterests(data.interests || []);
        setLookingFor(data.looking_for || "female");
        setRelationshipStatus(data.relationship_status || "single");
        setIsActive(data.is_active);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const profileData = {
      user_id: user.id,
      bio: bio.trim(),
      city: city.trim(),
      age: age ? parseInt(age) : null,
      job: job.trim() || null,
      education: education.trim() || null,
      interests,
      looking_for: lookingFor,
      relationship_status: relationshipStatus,
      is_active: isActive,
    };

    const { data: existing } = await supabase
      .from("dating_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("dating_profiles").update(profileData).eq("user_id", user.id);
    } else {
      await supabase.from("dating_profiles").insert({ ...profileData, photos: [] });
    }

    setSaving(false);
    router.push("/match");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/match" className="p-1 rounded-lg hover:bg-[var(--card)]">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text)]">Dating Profilini Düzenle</h1>
      </div>

      <div className="p-4 space-y-5 max-w-md mx-auto">
        {/* Active toggle */}
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text)]">Profil Aktif</span>
          <div
            className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${isActive ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
            onClick={() => setIsActive(!isActive)}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-5" : "left-1"}`} />
          </div>
        </label>

        <div>
          <label className="text-sm font-medium text-[var(--text)]">Biyografi</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none resize-none"
            placeholder="Kendini kısaca anlat..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Yaş</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} min={18} max={99}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Şehir</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Meslek</label>
            <input type="text" value={job} onChange={(e) => setJob(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Eğitim</label>
            <input type="text" value={education} onChange={(e) => setEducation(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="text-sm font-medium text-[var(--text)]">İlgi Alanları</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  interests.includes(interest)
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border-light)] text-[var(--text-muted)]"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Looking for */}
        <div>
          <label className="text-sm font-medium text-[var(--text)]">Aranan Cinsiyet</label>
          <div className="flex gap-3 mt-2">
            {[
              { value: "female", label: "Kadın" },
              { value: "male", label: "Erkek" },
              { value: "both", label: "Farketmez" },
            ].map((g) => (
              <button
                key={g.value}
                onClick={() => setLookingFor(g.value)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium ${
                  lookingFor === g.value
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border-light)] text-[var(--text-muted)]"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Relationship status */}
        <div>
          <label className="text-sm font-medium text-[var(--text)]">İlişki Durumu</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRelationshipStatus(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  relationshipStatus === opt.value
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border-light)] text-[var(--text-muted)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
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
