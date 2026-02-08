"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Navigation shortcuts
      switch (e.key) {
        case "g":
          // Wait for next key
          break;
        case "n":
          if (e.ctrlKey || e.metaKey) return;
          router.push("/new-post");
          break;
        case "/":
          e.preventDefault();
          // Focus search input
          const searchInput = document.querySelector(
            'input[placeholder*="ara"]'
          ) as HTMLInputElement;
          searchInput?.focus();
          break;
        case "Escape":
          // Blur any focused input
          (document.activeElement as HTMLElement)?.blur();
          break;
      }

      // J/K navigation for feed
      if (e.key === "j" || e.key === "k") {
        const articles = document.querySelectorAll("article");
        if (articles.length === 0) return;

        const focused = document.querySelector("article.keyboard-focused");
        let index = focused
          ? Array.from(articles).indexOf(focused as HTMLElement)
          : -1;

        if (e.key === "j") {
          index = Math.min(index + 1, articles.length - 1);
        } else {
          index = Math.max(index - 1, 0);
        }

        // Remove previous focus
        focused?.classList.remove("keyboard-focused");
        focused?.classList.remove("ring-2", "ring-[var(--primary)]");

        // Add new focus
        const next = articles[index];
        next.classList.add("keyboard-focused", "ring-2", "ring-[var(--primary)]");
        next.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
