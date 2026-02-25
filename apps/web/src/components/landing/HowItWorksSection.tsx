"use client";

import { UserPlus, Compass, Heart } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const STEPS = [
  {
    icon: UserPlus,
    title: "Kayıt Ol & Profil Oluştur",
    desc: "Hemen kayıt ol, profilini oluştur ve topluluğun parçası ol.",
  },
  {
    icon: Compass,
    title: "Topluluğu Keşfet",
    desc: "Paylaşımları gözden geçir, değerlendirmeleri oku, anonim itirafları keşfet.",
  },
  {
    icon: Heart,
    title: "Güvenle Eşleş",
    desc: "Topluluk puanını gör, gerçek değerlendirmeleri oku ve güvenle eşleş.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="nasil-calisir" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--text)] mb-16">
            Nasıl Çalışır?
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] bg-[var(--border-light)]" />

          {STEPS.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[var(--border-light)] bg-[var(--glass-bg)] backdrop-blur-sm">
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--primary)" }}>
                  {i + 1}
                </div>

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mt-2"
                  style={{ background: "var(--primary)", opacity: 0.15 }}
                >
                  <step.icon size={28} className="text-[var(--primary)]" style={{ opacity: 1 }} />
                </div>

                <h3 className="text-lg font-bold text-[var(--text)] mb-3">{step.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
