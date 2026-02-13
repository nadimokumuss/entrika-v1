"use client";

import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import MobileNav from "@/components/layout/MobileNav";

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-dvh">
      <div className="hidden md:block w-[72px] xl:w-[280px] shrink-0 border-r border-[var(--border-light)]">
        <Sidebar />
      </div>
      <main className="flex-1 max-w-[600px] min-h-dvh border-r border-[var(--border-light)] pb-16 md:pb-0">
        {children}
      </main>
      <div className="hidden lg:block w-[350px] shrink-0">
        <RightPanel />
      </div>
      <MobileNav />
    </div>
  );
}
