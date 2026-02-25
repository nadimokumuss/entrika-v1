"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, X, Search } from "lucide-react";
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

const RESTRICTED_STATUSES = ["married", "in_relationship"];

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
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerResults, setPartnerResults] = useState<Array<{ id: string; username: string; avatar_url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        if (data.partner_id) {
          setPartnerId(data.partner_id);
          const { data: partnerData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", data.partner_id)
            .single();
          if (partnerData) setPartnerUsername(partnerData.username);
        }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const needsPartner = ["in_relationship", "married", "open_relationship"].includes(relationshipStatus);

  // Partner search debounce
  useEffect(() => {
    if (!partnerSearch.trim()) {
      setPartnerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${partnerSearch.trim()}%`)
        .neq("id", user?.id || "")
        .limit(5);
      setPartnerResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [partnerSearch, user]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");

    try {
      const effectiveIsActive = RESTRICTED_STATUSES.includes(relationshipStatus) ? false : isActive;

      const profileData: Record<string, unknown> = {
        user_id: user.id,
        bio: bio.trim(),
        city: city.trim(),
        age: age ? parseInt(age) : null,
        job: job.trim() || null,
        education: education.trim() || null,
        interests,
        looking_for: lookingFor,
        relationship_status: relationshipStatus,
        is_active: effectiveIsActive,
        partner_id: needsPartner ? partnerId : null,
      };

      const { data: existing } = await supabase
        .from("dating_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        const { error } = await supabase.from("dating_profiles").update(profileData).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dating_profiles").insert({ ...profileData, photos: [] });
        if (error) throw error;
      }

      router.push("/match");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Profil kaydedilemedi.";
      setError(message);
    } finally {
      setSaving(false);
    }
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
            className={`w-10 h-6 rounded-full relative transition-colors ${RESTRICTED_STATUSES.includes(relationshipStatus) ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${isActive ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
            onClick={() => {
              if (!RESTRICTED_STATUSES.includes(relationshipStatus)) {
                setIsActive(!isActive);
              }
            }}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-5" : "left-1"}`} />
          </div>
        </label>
        {RESTRICTED_STATUSES.includes(relationshipStatus) && (
          <div className="px-4 py-3 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-sm text-[var(--warning)]">
            İlişkide veya evli kullanıcılar eşleşme özelliğini kullanamazlar.
          </div>
        )}

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
                onClick={() => {
                  setRelationshipStatus(opt.value);
                  if (RESTRICTED_STATUSES.includes(opt.value)) {
                    setIsActive(false);
                  }
                  if (!["in_relationship", "married", "open_relationship"].includes(opt.value)) {
                    setPartnerId(null);
                    setPartnerUsername(null);
                  }
                }}
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

        {/* Partner selection */}
        {needsPartner && (
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Partner</label>
            {partnerId && partnerUsername ? (
              <div className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border-light)]">
                <span className="text-sm text-[var(--text)] flex-1">@{partnerUsername}</span>
                <button
                  onClick={() => { setPartnerId(null); setPartnerUsername(null); }}
                  className="p-1 rounded-lg hover:bg-[var(--card-elevated)]"
                >
                  <X size={16} className="text-[var(--text-muted)]" />
                </button>
              </div>
            ) : (
              <div className="relative mt-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Kullanıcı adı ara..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none text-sm"
                />
                {partnerSearch.trim() && partnerResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[var(--border-light)] bg-[var(--background)] shadow-lg overflow-hidden z-20">
                    {partnerResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPartnerId(p.id);
                          setPartnerUsername(p.username);
                          setPartnerSearch("");
                          setPartnerResults([]);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--card)] transition-colors text-left"
                      >
                        <img
                          src={p.avatar_url || `https://api.dicebear.com/7.x/lorelei/png?seed=${p.id}`}
                          alt={p.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-[var(--text)]">@{p.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
            {error}
          </div>
        )}

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
