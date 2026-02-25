"use client";

import { CATEGORIES } from "@entrika/shared";
import ScrollReveal from "./ScrollReveal";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  itiraf: "İçini dökmenin en güvenli yolu. Anonim itiraflarla rahatla.",
  ifsa: "Topluluğu uyar, denetimsiz kalmış hikayeleri paylaş.",
  red_flag: "Dikkat edilmesi gereken işaretleri paylaş, topluluğu bilgilendir.",
  yilanlik: "İki yüzlü davranışları ifşa et, topluluğu koru.",
  dolandiricilik: "Dolandırıcılık girişimleri ve sahtekar profilleri raporla.",
  tavsiye: "Dating tavsiyeleri, deneyimler ve bol öneriler.",
};

export default function CategoriesSection() {
  return (
    <section id="kategoriler" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--text)] mb-16">
            Topluluk Kategorileri
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(CATEGORIES).map(([key, cat], i) => (
            <ScrollReveal key={key} delay={i * 0.1}>
              <div
                className="p-5 rounded-2xl border-2 transition-transform hover:-translate-y-1 duration-300"
                style={{
                  borderColor: cat.color + "40",
                  background: cat.color + "08",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{cat.emoji}</span>
                  <h3 className="text-lg font-bold" style={{ color: cat.color }}>
                    {cat.label}
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[key]}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
