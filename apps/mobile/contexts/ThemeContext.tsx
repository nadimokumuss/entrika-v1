import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  lightColors, darkColors,
  lightGradients, darkGradients,
  lightGlass, darkGlass,
  type ThemeColors, type ThemeGradients, type ThemeGlass,
} from "@/constants/theme";

type ThemeContextType = {
  colors: ThemeColors;
  gradients: ThemeGradients;
  glass: ThemeGlass;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

// Storage helpers — AsyncStorage on native, localStorage on web
const THEME_KEY = "entrika_theme_dark";

async function loadThemePreference(): Promise<boolean | null> {
  try {
    if (Platform.OS === "web") {
      const val = localStorage.getItem(THEME_KEY);
      return val !== null ? val === "true" : null;
    }
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const val = await AsyncStorage.getItem(THEME_KEY);
    return val !== null ? val === "true" : null;
  } catch {
    return null;
  }
}

async function saveThemePreference(isDark: boolean): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(THEME_KEY, String(isDark));
      return;
    }
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.setItem(THEME_KEY, String(isDark));
  } catch {
    // silently fail
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false); // default: light

  useEffect(() => {
    loadThemePreference().then((saved) => {
      if (saved !== null) setIsDark(saved);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      saveThemePreference(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextType>(() => ({
    colors: isDark ? darkColors : lightColors,
    gradients: isDark ? darkGradients : lightGradients,
    glass: isDark ? darkGlass : lightGlass,
    isDark,
    toggleTheme,
  }), [isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
