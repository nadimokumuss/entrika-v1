"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message || "Giris yapilamadi");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center">
      <Logo size={48} />
      <h1 className="text-2xl font-bold mt-6 mb-2 text-[var(--text)]">
        Entrika&apos;ya Giris Yap
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Tanismadan once tani
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

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
          placeholder="Sifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Giris yapiliyor..." : "Giris Yap"}
        </button>
      </form>

      <div className="mt-6 text-sm text-[var(--text-muted)]">
        <Link
          href="/forgot-password"
          className="text-[var(--primary)] hover:underline"
        >
          Sifremi Unuttum
        </Link>
      </div>

      <div className="mt-4 text-sm text-[var(--text-muted)]">
        Hesabin yok mu?{" "}
        <Link
          href="/register"
          className="text-[var(--primary)] font-semibold hover:underline"
        >
          Kayit Ol
        </Link>
      </div>
    </div>
  );
}
