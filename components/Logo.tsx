import React from "react";
import { View, StyleSheet } from "react-native";

export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: "#A855F7", width: size }]} />
      <View style={[styles.bar, { backgroundColor: "#F472B6", width: size }]} />
      <View style={[styles.bar, { backgroundColor: "#8B5CF6", width: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 3,
    alignItems: "center",
  },
  bar: {
    height: 3,
    borderRadius: 2,
  },
});
