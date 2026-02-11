"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!gender) {
      setError("Lutfen cinsiyet secin");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, username, gender);
    if (error) {
      setError(error.message || "Kayit olamadi");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center">
      <Logo size={48} />
      <h1 className="text-2xl font-bold mt-6 mb-2 text-[var(--text)]">
        Hesap Olustur
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Entrika&apos;ya katil
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Kullanici adi"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
        />

        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
        />

        <input
          type="password"
          placeholder="Sifre (en az 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
        />

        {/* Gender Selection */}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Kayit olunuyor..." : "Kayit Ol"}
        </button>
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
