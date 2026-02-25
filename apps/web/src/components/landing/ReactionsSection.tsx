"use client";

import { REACTIONS } from "@entrika/shared";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

export default function ReactionsSection() {
  const reactionEntries = Object.entries(REACTIONS);

  return (
    <section className="py-24 px-4 bg-[var(--card)]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--text)] mb-16">
            10 Benzersiz Tepki
          </h2>
        </ScrollReveal>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {reactionEntries.map(([key, r], i) => (
            <motion.div
              key={key}
              className="flex flex-col items-center gap-2 cursor-default"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ scale: 1.2 }}
            >
              <span className="text-4xl md:text-5xl">{r.emoji}</span>
              <span className="text-xs font-medium text-[var(--text-muted)]">{r.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
