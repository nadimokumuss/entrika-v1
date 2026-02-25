"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

const NAV_LINKS = [
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#kategoriler", label: "Kategoriler" },
  { href: "#guvenlik", label: "Güvenlik" },
];

export default function LandingHeader() {
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border-light)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-lg font-bold text-[var(--text)]">Entrika</span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-[var(--card)] text-[var(--text-muted)]"
            aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text)] hover:bg-[var(--card)] transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: "var(--primary)" }}
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </header>
  );
}
