"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Heart,
  MessageCircle,
  Bell,
  Bookmark,
  User,
  Settings,
  PenSquare,
  Sun,
  Moon,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/explore", label: "Keşfet", icon: Compass },
  { href: "/match", label: "Eşleşme", icon: Heart },
  { href: "/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/notifications", label: "Bildirimler", icon: Bell },
  { href: "/bookmarks", label: "Yer İmleri", icon: Bookmark },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { profile } = useAuth();

  return (
    <aside className="sticky top-0 h-dvh flex flex-col justify-between py-4 px-3">
      {/* Logo */}
      <div>
        <Link href="/" className="flex items-center gap-3 px-3 py-2 mb-4">
          <Logo size={28} />
          <span className="text-xl font-bold text-[var(--text)] hidden xl:block">
            Entrika
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all hover:bg-[var(--card)] ${
                  isActive
                    ? "font-bold text-[var(--primary)]"
                    : "text-[var(--text)]"
                }`}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-[var(--primary)]" : ""}
                />
                <span className="hidden xl:block text-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* New Post Button */}
        <Link
          href="/new-post"
          className="flex items-center justify-center gap-2 mt-4 px-4 py-3 rounded-xl font-bold text-white"
          style={{ background: "var(--primary)" }}
        >
          <PenSquare size={20} />
          <span className="hidden xl:block">Paylas</span>
        </Link>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-[var(--card)] text-[var(--text-muted)]"
          aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
        >
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
          <span className="hidden xl:block text-sm">
            {isDark ? "Açık Tema" : "Koyu Tema"}
          </span>
        </button>

        {/* User profile mini */}
        {profile && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--card)] cursor-pointer">
            <img
              src={
                profile.avatar_url ||
                `https://api.dicebear.com/7.x/lorelei/png?seed=${profile.id}`
              }
              alt={profile.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="hidden xl:block">
              <p className="text-sm font-semibold text-[var(--text)]">
                {profile.username}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                @{profile.username}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
