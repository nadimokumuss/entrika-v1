"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, MessageCircle, Bell, User } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/explore", label: "Kesfet", icon: Compass },
  { href: "/match", label: "Eslesme", icon: Heart },
  { href: "/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/notifications", label: "Bildirimler", icon: Bell },
  { href: "/profile", label: "Profil", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 bg-[var(--background)] border-t border-[var(--border-light)] md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 ${
              isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {item.href === "/notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center px-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
