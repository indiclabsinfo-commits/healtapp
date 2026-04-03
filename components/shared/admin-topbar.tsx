"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useRouter } from "next/navigation";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header
      className="flex items-center justify-between border-b px-4 py-5 pl-16 lg:px-8"
      style={{ borderColor: "var(--border-card)" }}
    >
      <div>
        <h1
          className="font-heading text-[26px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-input px-4 py-2"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Theme toggle */}
        <ThemeToggle size="sm" />

        {/* Notification */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
          }}
        >
          <Bell size={15} />
        </button>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-[12px] px-2 py-1 transition-all"
            style={{
              background: dropdownOpen ? "var(--bg-card-hover)" : "transparent",
              border: "1px solid transparent",
              borderColor: dropdownOpen ? "var(--border-card)" : "transparent",
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-icon text-xs font-bold"
              style={{
                background: "var(--gradient-cta)",
                color: "var(--cta-text)",
              }}
            >
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="hidden flex-col items-start lg:flex">
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {user?.name || "Admin"}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {user?.role === "ADMIN" ? "Super Admin" : "Admin"}
              </span>
            </div>
            <ChevronDown
              size={13}
              style={{
                color: "var(--text-muted)",
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-[14px]"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-card)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* User info header */}
              <div
                className="border-b px-4 py-3"
                style={{ borderColor: "var(--border-card)" }}
              >
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {user?.name || "Admin User"}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {user?.email || "admin@ambrin.app"}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); router.push("/profile"); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-white/5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <User size={14} />
                  My Profile
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-white/5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>

              {/* Logout */}
              <div
                className="border-t py-1"
                style={{ borderColor: "var(--border-card)" }}
              >
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-red-500/10"
                  style={{ color: "#FF6B6B" }}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
