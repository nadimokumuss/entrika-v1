import React from "react";
import { View, StyleSheet, Image, ImageStyle } from "react-native";

interface LogoProps {
  size?: number;
  style?: ImageStyle;
}

export default function Logo({ size = 24, style }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Text-based logo for now since we don't have a logo image */}
      <View style={[styles.textLogo, { width: size, height: size }]}>
        <View style={styles.logoInner}>
          <View style={[styles.logoBar, { backgroundColor: "#A855F7" }]} />
          <View style={[styles.logoBar, { backgroundColor: "#F472B6" }]} />
          <View style={[styles.logoBar, { backgroundColor: "#8B5CF6" }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  textLogo: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    gap: 2,
  },
  logoBar: {
    width: "100%",
    height: 3,
    borderRadius: 2,
  },
});
