"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AppModalProps {
  open: boolean;
  type: "confirm" | "alert" | "prompt";
  title: string;
  message?: string;
  options?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export function AppModal({
  open,
  type,
  title,
  message,
  options,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: AppModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    if (type === "prompt") {
      if (selectedOption === "Diğer") {
        onConfirm(customText.trim() || undefined);
      } else {
        onConfirm(selectedOption || undefined);
      }
      setSelectedOption(null);
      setCustomText("");
    } else {
      onConfirm();
    }
  };

  const handleCancel = () => {
    setSelectedOption(null);
    setCustomText("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleCancel}>
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border border-[var(--border-light)] bg-[var(--background)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
          <h2 className="text-base font-bold text-[var(--text)]">{title}</h2>
          <button onClick={handleCancel} className="p-1 rounded-lg hover:bg-[var(--card)]" aria-label="Kapat">
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {message && <p className="text-sm text-[var(--text-muted)] mb-4">{message}</p>}

          {type === "prompt" && options && (
            <div className="space-y-2">
              {options.map((opt) => (
                <label
                  key={opt}
                  onClick={() => setSelectedOption(opt)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedOption === opt
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border-light)] hover:bg-[var(--card)]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedOption === opt ? "border-[var(--primary)]" : "border-[var(--border)]"
                    }`}
                  >
                    {selectedOption === opt && <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                  </div>
                  <span className="text-sm text-[var(--text)]">{opt}</span>
                </label>
              ))}

              {selectedOption === "Diğer" && (
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Sebebi yazın..."
                  rows={3}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none resize-none text-sm"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[var(--border-light)]">
          {type !== "alert" && (
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] bg-[var(--card)] hover:bg-[var(--card-elevated)] transition-colors"
            >
              {cancelLabel || "İptal"}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={type === "prompt" && !selectedOption}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 ${
              danger ? "bg-red-500 hover:bg-red-600" : ""
            }`}
            style={!danger ? { background: "var(--primary)" } : undefined}
          >
            {confirmLabel || (type === "alert" ? "Tamam" : "Onayla")}
          </button>
        </div>
      </div>
    </div>
  );
}
