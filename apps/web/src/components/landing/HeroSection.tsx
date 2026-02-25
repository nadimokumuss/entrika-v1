"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";

const FLOATING_EMOJIS = [
  { emoji: "\uD83D\uDD25", x: "10%", y: "20%", delay: 0 },
  { emoji: "\uD83E\uDD1D", x: "85%", y: "15%", delay: 0.5 },
  { emoji: "\uD83D\uDC0D", x: "5%", y: "70%", delay: 1 },
  { emoji: "\uD83D\uDE31", x: "90%", y: "65%", delay: 1.5 },
  { emoji: "\uD83D\uDC4F", x: "20%", y: "85%", delay: 2 },
  { emoji: "\u2764\uFE0F", x: "80%", y: "80%", delay: 2.5 },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-dvh flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Floating emojis */}
      {FLOATING_EMOJIS.map((item, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl md:text-4xl opacity-20 select-none pointer-events-none"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.span>
      ))}

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="mb-8">
          <Logo size={64} />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gradient-primary">
          Tanışmadan Önce Tanı
        </h1>

        <p className="text-lg md:text-xl text-[var(--text-muted)] mb-10 leading-relaxed max-w-xl mx-auto">
          Türkiye&apos;nin ilk topluluk destekli dating ve sosyal istihbarat platformu.
          Eşleşmeden önce karşı tarafın topluluk puanını gör, gerçek değerlendirmeleri oku.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-xl text-base font-bold text-white transition-transform hover:scale-105 active:scale-98"
            style={{ background: "var(--primary)" }}
          >
            Hemen Başla
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl text-base font-bold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--card)] transition-colors"
          >
            Giriş Yap
          </Link>
        </div>

        <p className="text-sm text-[var(--text-muted)]">
          Ücretsiz kayıt ol, kredi kartı gerekmez
        </p>
      </motion.div>
    </section>
  );
}
