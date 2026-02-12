"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";

export default function Logo({ size = 32 }: { size?: number }) {
  const { isDark } = useTheme();

  return (
    <Image
      src={isDark ? "/entrika-logo-beyaz.png" : "/entrika-logo-siyah.png"}
      alt="Entrika"
      width={size * 3}
      height={size}
      style={{ height: size, width: "auto" }}
      priority
    />
  );
}
