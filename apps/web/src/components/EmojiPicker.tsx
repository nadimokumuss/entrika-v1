"use client";

import { useRef, useEffect } from "react";
import { SmilePlus } from "lucide-react";
import { REACTIONS } from "@entrika/shared";

interface EmojiPickerProps {
  onSelect: (key: string) => void;
  activeReactions?: string[];
  isOpen: boolean;
  onToggle: () => void;
}

// Inject keyframes once
let injected = false;
function injectKeyframes() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes emojiPopIn {
      0% { opacity: 0; transform: scale(0); }
      70% { transform: scale(1.2); opacity: 1; }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export function EmojiPicker({ onSelect, activeReactions = [], isOpen, onToggle }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-[var(--border-light)] hover:bg-[var(--card)] text-[var(--text-muted)]"
        aria-label="Tepki ekle"
      >
        <SmilePlus size={14} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 flex items-center gap-0.5 p-1 rounded-xl border border-[var(--border-light)] bg-[var(--background)] shadow-lg z-30">
          {Object.entries(REACTIONS).map(([key, r], i) => {
            const isActive = activeReactions.includes(key);
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`px-1.5 py-1 rounded-lg text-sm hover:bg-[var(--card)] transition-all ${
                  isActive ? "bg-[var(--primary)]/10 scale-110" : ""
                }`}
                style={{
                  animation: `emojiPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 50}ms both`,
                }}
                title={r.label}
              >
                {r.emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
