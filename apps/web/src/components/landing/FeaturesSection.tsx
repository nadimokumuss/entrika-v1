"use client";

import { Shield, Smile, EyeOff, Heart, MessageCircle, Lock } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const FEATURES = [
  {
    icon: Shield,
    title: "Topluluk Puanı",
    desc: "Her kullanıcının topluluk tarafından verilen bir güvenilirlik puanı var.",
  },
  {
    icon: Smile,
    title: "10 Benzersiz Tepki",
    desc: "Alev, Yanındayım, Yılan, Şok, Helal... Standart beğeninin ötesinde.",
  },
  {
    icon: EyeOff,
    title: "Anonim Paylaşım",
    desc: "İtiraflar, red flag'ler, tavsiyeler... Kimliğini gizleyerek paylaş.",
  },
  {
    icon: Heart,
    title: "Akıllı Eşleştirme",
    desc: "Tinder tarzında swipe, ama topluluk puanını da görüyorsun.",
  },
  {
    icon: MessageCircle,
    title: "Gerçek Zamanlı Mesajlaşma",
    desc: "Eşleştikten sonra hemen sohbet başla.",
  },
  {
    icon: Lock,
    title: "Güvenlik Öncelikli",
    desc: "Engelleme, şikayet, anonim mod. Güvenliğin her zaman ön planda.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="ozellikler" className="py-24 px-4 bg-[var(--card)]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--text)] mb-16">
            Neden Entrika?
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="p-6 rounded-2xl border border-[var(--border-light)] bg-[var(--background)] hover:-translate-y-1 transition-transform duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
                >
                  <feature.icon size={24} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="text-lg font-bold text-[var(--text)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
