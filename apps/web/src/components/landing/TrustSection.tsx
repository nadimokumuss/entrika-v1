"use client";

import { Users, Shield, Ban } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const TRUST_ITEMS = [
  {
    icon: Users,
    title: "Topluluk İstihbaratı",
    desc: "Topluluk herkesi değerlendiriyor, gerçek bilgi ön planda.",
  },
  {
    icon: Shield,
    title: "Anonim Koruma",
    desc: "Anonim paylaşımlarla gizliliğin korunuyor.",
  },
  {
    icon: Ban,
    title: "Engelleme & Şikayet",
    desc: "İstenmeyen kişiler anında engellenebilir.",
  },
];

export default function TrustSection() {
  return (
    <section id="guvenlik" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--text)] mb-16">
            Güvenliğin Ön Planda
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRUST_ITEMS.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-[var(--card)] border border-[var(--border-light)]">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
                >
                  <item.icon size={32} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-3">{item.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
