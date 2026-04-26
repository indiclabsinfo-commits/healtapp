"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon, Globe, Heart, Info } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { getLanguage, setLanguage, LANG_STORAGE_KEY } from "@/lib/preferences";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "gu", label: "ગુજરાતી" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [lang, setLang] = useState("en");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Hydrate language preference from localStorage on mount
  useEffect(() => {
    setLang(getLanguage());
  }, []);

  function changeLanguage(code: string) {
    setLang(code);
    setLanguage(code);
  }

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>App preferences</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card mb-4 p-5" style={{ borderRadius: "16px" }}>
        <div className="mb-3 flex items-center gap-2">
          <Sun size={14} style={{ color: "var(--accent-primary)" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Appearance</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: "dark", label: "Dark", Icon: Moon },
            { val: "light", label: "Light", Icon: Sun },
          ].map(({ val, label, Icon }) => (
            <button
              key={val}
              onClick={() => setTheme(val)}
              className="flex items-center justify-center gap-2 rounded-[12px] py-3 text-[13px] font-medium transition-all"
              style={{
                background: theme === val ? "var(--gradient-cta)" : "var(--input-bg)",
                color: theme === val ? "#0B0C10" : "var(--text-secondary)",
                border: theme === val ? "none" : "1px solid var(--border-card)",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="glass-card mb-4 p-5" style={{ borderRadius: "16px" }}>
        <div className="mb-3 flex items-center gap-2">
          <Globe size={14} style={{ color: "var(--accent-primary)" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Language</p>
        </div>
        <div className="space-y-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              className="flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-[13px] transition-all"
              style={{
                background: lang === l.code ? "var(--pill-active-bg)" : "transparent",
                color: lang === l.code ? "var(--accent-primary)" : "var(--text-secondary)",
              }}
            >
              <span>{l.label}</span>
              {lang === l.code && (
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent-primary)" }} />
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
          Language preference applies to assessment questions and feedback.
        </p>
      </div>

      {/* About */}
      <div className="glass-card mb-4 p-5" style={{ borderRadius: "16px" }}>
        <div className="mb-3 flex items-center gap-2">
          <Info size={14} style={{ color: "var(--accent-primary)" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>About</p>
        </div>
        <div className="space-y-2.5">
          {[
            { label: "App", value: "ambrin by Snowflakes Counselling" },
            { label: "Version", value: "1.0.0" },
            { label: "Account", value: user?.email ?? "—" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-0.5" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wellness credit */}
      <div className="glass-card mb-6 p-4" style={{ borderRadius: "16px", background: "rgba(111,255,233,0.05)", border: "1px solid rgba(111,255,233,0.12)" }}>
        <div className="flex items-center gap-2">
          <Heart size={12} style={{ color: "var(--accent-primary)" }} />
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Your mental health matters. Reach out to your counsellor whenever you need support.
          </p>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="w-full rounded-[14px] py-3.5 text-[13px] font-semibold transition-all"
        style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.15)" }}
      >
        Sign Out
      </button>
    </div>
  );
}
