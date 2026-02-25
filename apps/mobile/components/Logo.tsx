import React from "react";
import { Image, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const logoWhite = require("@/assets/images/entrika-logo-beyaz.png");
const logoBlack = require("@/assets/images/entrika-logo-siyah.png");

export default function Logo({ size = 20 }: { size?: number }) {
  const { isDark } = useTheme();

  return (
    <Image
      source={isDark ? logoWhite : logoBlack}
      style={{ width: size * 4, height: size, resizeMode: "contain" }}
    />
  );
}
