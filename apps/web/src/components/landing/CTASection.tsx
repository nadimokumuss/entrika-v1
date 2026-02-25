"use client";

import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

export default function CTASection() {
  return (
    <section className="py-24 px-4" style={{ background: "var(--primary)" }}>
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hazır mısın?
          </h2>
          <p className="text-lg text-white/80 mb-10">
            Entrika&apos;ya katıl, topluluğu keşfet ve güvenle tanı.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-xl text-lg font-bold bg-white transition-transform hover:scale-105 active:scale-98"
            style={{ color: "var(--primary)" }}
          >
            Hemen Kayıt Ol
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
