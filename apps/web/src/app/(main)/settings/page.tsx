"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LogOut, Moon, Sun, Shield, Bell, Lock, Keyboard } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  showNotification,
} from "@/lib/notifications";

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotifPermission(getNotificationPermission() as string);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    if (granted) {
      showNotification("Entrika", "Bildirimler basariyla acildi!");
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Ayarlar</h1>
      </div>

      <div className="p-4 space-y-2">
        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={20} className="text-[var(--text-muted)]" /> : <Sun size={20} className="text-[var(--text-muted)]" />}
            <span className="text-[var(--text)]">Tema</span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">{isDark ? "Koyu" : "Acik"}</span>
        </button>

        {/* Notifications */}
        <button
          onClick={handleNotifications}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">Masaustu Bildirimleri</span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {notifPermission === "granted" ? "Acik" : notifPermission === "denied" ? "Engellendi" : "Kapali"}
          </span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <Keyboard size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">Klavye Kisayollari</span>
          </div>
        </button>

        {showShortcuts && (
          <div className="px-4 py-3 rounded-xl bg-[var(--card)] text-sm space-y-2">
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Asagi git</span><kbd className="px-2 py-0.5 rounded bg-[var(--card-elevated)] text-[var(--text)] text-xs font-mono">J</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Yukari git</span><kbd className="px-2 py-0.5 rounded bg-[var(--card-elevated)] text-[var(--text)] text-xs font-mono">K</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Yeni paylasim</span><kbd className="px-2 py-0.5 rounded bg-[var(--card-elevated)] text-[var(--text)] text-xs font-mono">N</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Ara</span><kbd className="px-2 py-0.5 rounded bg-[var(--card-elevated)] text-[var(--text)] text-xs font-mono">/</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Iptal</span><kbd className="px-2 py-0.5 rounded bg-[var(--card-elevated)] text-[var(--text)] text-xs font-mono">Esc</kbd></div>
          </div>
        )}

        {/* Privacy */}
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--card)]">
          <Lock size={20} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text)]">Gizlilik</span>
        </button>

        {/* Blocked Users */}
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--card)]">
          <Shield size={20} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text)]">Engellenenler</span>
        </button>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--danger)]/10 text-[var(--danger)] mt-4"
        >
          <LogOut size={20} />
          <span>Cikis Yap</span>
        </button>
      </div>

      {/* Version */}
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-[var(--text-muted)]">Entrika v1.0.0</p>
      </div>
    </div>
  );
}
