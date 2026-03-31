"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  size?: "sm" | "md";
}

export function ThemeToggle({ size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    const dim = size === "sm" ? 32 : 36;
    return <div style={{ width: dim, height: dim, flexShrink: 0 }} />;
  }

  const isDark = theme === "dark";
  const dim = size === "sm" ? 32 : 36;
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center rounded-[10px] transition-all hover:scale-105 active:scale-95"
      style={{
        width: dim,
        height: dim,
        flexShrink: 0,
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        color: "var(--text-muted)",
      }}
    >
      {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
    </button>
  );
}
