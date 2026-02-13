"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import MobileNav from "@/components/layout/MobileNav";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useKeyboardShortcuts();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex justify-center min-h-dvh">
      {/* Left Sidebar - hidden on mobile */}
      <div className="hidden md:block w-[72px] xl:w-[280px] shrink-0 border-r border-[var(--border-light)]">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[600px] min-h-dvh border-r border-[var(--border-light)] pb-16 md:pb-0">
        {children}
      </main>

      {/* Right Panel - hidden on tablet and mobile */}
      <div className="hidden lg:block w-[350px] shrink-0">
        <RightPanel />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
