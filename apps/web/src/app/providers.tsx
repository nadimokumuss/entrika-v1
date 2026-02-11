"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FollowProvider } from "@/contexts/FollowContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FollowProvider>{children}</FollowProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
