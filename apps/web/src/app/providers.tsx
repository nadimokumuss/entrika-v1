"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FollowProvider } from "@/contexts/FollowContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <FollowProvider>{children}</FollowProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
