"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import {
  LogOut, Moon, Sun, Shield, Bell, Lock, Keyboard,
  User, Mail, KeyRound, Trash2, ChevronRight, Info, ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  showNotification,
} from "@/lib/notifications";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setMessage("E-posta güncellenemedi: " + error.message);
    } else {
      setMessage("Doğrulama e-postası gönderildi. Lütfen kontrol edin.");
      setNewEmail("");
      setShowEmailChange(false);
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage("Şifreler eşleşmiyor");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Şifre en az 6 karakter olmalı");
      return;
    }
    setSaving(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage("Şifre güncellenemedi: " + error.message);
    } else {
      setMessage("Şifre başarıyla güncellendi");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    // Account deletion - mark profile as deleted
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ username: "deleted_" + user.id.slice(0, 8), bio: null, avatar_url: null }).eq("id", user.id);
    await signOut();
    router.replace("/login");
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Ayarlar</h1>
      </div>

      {message && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-sm">
          {message}
        </div>
      )}

      <div className="p-4 space-y-1">
        {/* SECTION: Görünüm */}
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 pt-2 pb-1">Görünüm</p>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={20} className="text-[var(--text-muted)]" /> : <Sun size={20} className="text-[var(--text-muted)]" />}
            <span className="text-[var(--text)]">Tema</span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">{isDark ? "Koyu" : "Açık"}</span>
        </button>

        {/* SECTION: Hesap */}
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 pt-4 pb-1">Hesap</p>

        <Link
          href="/edit-profile"
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <User size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">Profili Düzenle</span>
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </Link>

        <button
          onClick={() => { setShowEmailChange(!showEmailChange); setShowPasswordChange(false); }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">E-posta Değiştir</span>
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </button>

        {showEmailChange && (
          <div className="px-4 py-3 rounded-xl bg-[var(--card)] space-y-3">
            <p className="text-xs text-[var(--text-muted)]">Mevcut: {user?.email}</p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Yeni e-posta adresi"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none text-sm"
            />
            <button
              onClick={handleEmailChange}
              disabled={saving}
              className="w-full py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {saving ? "Güncelleniyor..." : "Güncelle"}
            </button>
          </div>
        )}

        <button
          onClick={() => { setShowPasswordChange(!showPasswordChange); setShowEmailChange(false); }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <KeyRound size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">Şifre Değiştir</span>
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </button>

        {showPasswordChange && (
          <div className="px-4 py-3 rounded-xl bg-[var(--card)] space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifre"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none text-sm"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifre tekrar"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] text-[var(--text)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none text-sm"
            />
            <button
              onClick={handlePasswordChange}
              disabled={saving}
              className="w-full py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </div>
        )}

        {/* SECTION: Bildirimler */}
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 pt-4 pb-1">Bildirimler</p>

        <button
          onClick={handleNotifications}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">Masaüstü Bildirimleri</span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {notifPermission === "granted" ? "Açık" : notifPermission === "denied" ? "Engellendi" : "Kapalı"}
          </span>
        </button>

        {/* SECTION: Gizlilik */}
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 pt-4 pb-1">Gizlilik</p>

        <Link
          href="/blocked-users"
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">Engellenen Kullanıcılar</span>
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </Link>

        {/* SECTION: Diğer */}
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 pt-4 pb-1">Diğer</p>

        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--card)]"
        >
          <div className="flex items-center gap-3">
            <Keyboard size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text)]">Klavye Kısayolları</span>
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </button>

        {showShortcuts && (
          <div className="px-4 py-3 rounded-xl bg-[var(--card)] text-sm space-y-2">
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Aşağı git</span><kbd className="px-2 py-0.5 rounded bg-[var(--background)] text-[var(--text)] text-xs font-mono">J</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Yukarı git</span><kbd className="px-2 py-0.5 rounded bg-[var(--background)] text-[var(--text)] text-xs font-mono">K</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Yeni paylaşım</span><kbd className="px-2 py-0.5 rounded bg-[var(--background)] text-[var(--text)] text-xs font-mono">N</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">Ara</span><kbd className="px-2 py-0.5 rounded bg-[var(--background)] text-[var(--text)] text-xs font-mono">/</kbd></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">İptal</span><kbd className="px-2 py-0.5 rounded bg-[var(--background)] text-[var(--text)] text-xs font-mono">Esc</kbd></div>
          </div>
        )}

        {/* Hakkinda */}
        <div className="px-4 py-3 rounded-xl hover:bg-[var(--card)] flex items-center gap-3">
          <Info size={20} className="text-[var(--text-muted)]" />
          <div>
            <p className="text-[var(--text)]">Hakkında</p>
            <p className="text-xs text-[var(--text-muted)]">Entrika v1.0.0</p>
          </div>
        </div>

        {/* Hesap Sil */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--danger)]/10 text-[var(--danger)] mt-2"
        >
          <Trash2 size={20} />
          <span>Hesabı Sil</span>
        </button>

        {showDeleteConfirm && (
          <div className="px-4 py-3 rounded-xl bg-[var(--danger)]/10 space-y-3">
            <p className="text-sm text-[var(--danger)] font-medium">Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] text-sm font-medium"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-[var(--danger)] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        )}

        {/* Cikis */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--danger)]/10 text-[var(--danger)] mt-2"
        >
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
}
