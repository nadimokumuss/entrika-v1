"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function Logo({ size = 32 }: { size?: number }) {
  const { isDark } = useTheme();

  const barWidth = size * 0.15;
  const gap = size * 0.08;
  const heights = [size * 0.5, size * 0.75, size];

  const colors = isDark
    ? ["#C084FC", "#A855F7", "#F472B6"]
    : ["#FFA04D", "#FF7F11", "#E06A00"];

  return (
    <div className="flex items-end" style={{ gap, height: size }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: h,
            backgroundColor: colors[i],
            borderRadius: barWidth * 0.3,
          }}
        />
      ))}
    </div>
  );
}
