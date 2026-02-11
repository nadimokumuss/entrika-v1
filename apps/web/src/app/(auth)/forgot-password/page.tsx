"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <Logo size={48} />
        <h1 className="text-2xl font-bold mt-6 mb-2 text-[var(--text)]">
          E-posta Gonderildi
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Sifre sifirlama linki {email} adresine gonderildi.
        </p>
        <Link
          href="/login"
          className="text-[var(--primary)] font-semibold hover:underline"
        >
          Giris sayfasina don
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <Logo size={48} />
      <h1 className="text-2xl font-bold mt-6 mb-2 text-[var(--text)]">
        Sifremi Unuttum
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        E-posta adresini gir, sifre sifirlama linki gonderelim
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Gonderiliyor..." : "Sifirlama Linki Gonder"}
        </button>
      </form>

      <div className="mt-6 text-sm text-[var(--text-muted)]">
        <Link
          href="/login"
          className="text-[var(--primary)] hover:underline"
        >
          Giris sayfasina don
        </Link>
      </div>
    </div>
  );
}
