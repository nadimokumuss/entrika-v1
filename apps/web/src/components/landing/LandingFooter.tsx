"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function LandingFooter() {
  return (
    <footer className="py-12 px-4 border-t border-[var(--border-light)]">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Logo size={24} />
          <span className="text-sm text-[var(--text-muted)]">
            Entrika - Tanışmadan Önce Tanı
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Giriş Yap
          </Link>
          <Link href="/register" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Kayıt Ol
          </Link>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          &copy; 2026 Entrika. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
