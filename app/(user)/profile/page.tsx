"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { getMyAssessmentsApi } from "@/lib/assessments";
import { getMoodHistoryApi } from "@/lib/mood";
import {
  BarChart3,
  Bell,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

interface Stats {
  assessments: number;
  sessions: number;
  streak: number;
}

const MENU_ITEMS = [
  {
    icon: BarChart3,
    label: "Assessment History",
    href: "/assessment/history",
    emoji: "\uD83D\uDCCA",
  },
  {
    icon: Bell,
    label: "Notifications",
    href: "/notifications",
    emoji: "\uD83D\uDD14",
  },
  {
    icon: Shield,
    label: "Privacy & Security",
    href: "/privacy",
    emoji: "\uD83D\uDD12",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
    emoji: "\u2699\uFE0F",
  },
];

export default function UserProfile() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [stats, setStats] = useState<Stats>({
    assessments: 0,
    sessions: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [assessRes, moodRes] = await Promise.allSettled([
          getMyAssessmentsApi({ page: 1, limit: 1 }),
          getMoodHistoryApi(30),
        ]);

        let assessmentCount = 0;
        let streakDays = 0;

        // Get total assessment count from pagination
        if (
          assessRes.status === "fulfilled" &&
          assessRes.value.success
        ) {
          assessmentCount = assessRes.value.pagination?.total || 0;
        }

        // Calculate mood streak from history
        if (
          moodRes.status === "fulfilled" &&
          moodRes.value.success &&
          moodRes.value.data
        ) {
          streakDays = calculateStreak(moodRes.value.data);
        }

        setStats({
          assessments: assessmentCount,
          sessions: 0, // Counsellor sessions - future feature
          streak: streakDays,
        });
      } catch {
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const calculateStreak = (
    moodLogs: Array<{ date: string; mood: number }>
  ): number => {
    if (!moodLogs || moodLogs.length === 0) return 0;

    // Sort descending by date
    const sorted = [...moodLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sorted.length; i++) {
      const logDate = new Date(sorted[i].date);
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getInitial = () => {
    if (!user?.name) return "?";
    return user.name.charAt(0).toUpperCase();
  };

  const getMemberSince = () => {
    if (!user?.createdAt) return "";
    const date = new Date(user.createdAt);
    return `Member since ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
  };

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center pt-4">
        <div
          className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-[24px]"
          style={{
            background: "var(--gradient-cta)",
          }}
        >
          <span
            className="text-[32px] font-bold"
            style={{ color: "var(--cta-text)" }}
          >
            {getInitial()}
          </span>
        </div>

        <h1
          className="font-heading text-[20px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {user?.name || "User"}
        </h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {getMemberSince()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          <div className="glass-card col-span-3 flex items-center justify-center py-6">
            <Loader2
              size={20}
              className="animate-spin"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        ) : (
          <>
            <div className="glass-card flex flex-col items-center py-4">
              <span
                className="font-heading text-[22px] font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {stats.assessments}
              </span>
              <span
                className="mt-1 text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                Assessments
              </span>
            </div>

            <div className="glass-card flex flex-col items-center py-4">
              <span
                className="font-heading text-[22px] font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {stats.sessions}
              </span>
              <span
                className="mt-1 text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                Sessions
              </span>
            </div>

            <div className="glass-card flex flex-col items-center py-4">
              <span
                className="font-heading text-[22px] font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {stats.streak}
                <span className="text-[14px] font-normal" style={{ color: "var(--text-muted)" }}>d</span>
              </span>
              <span
                className="mt-1 text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                Streak
              </span>
            </div>
          </>
        )}
      </div>

      {/* Menu Items */}
      <div
        className="glass-card overflow-hidden"
        style={{ padding: 0 }}
      >
        {MENU_ITEMS.map((item, index) => (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className="flex w-full items-center gap-3 px-4 py-[14px] text-left transition-colors"
            style={{
              borderBottom:
                index < MENU_ITEMS.length - 1
                  ? "1px solid var(--border-card)"
                  : "none",
            }}
          >
            <span className="text-[16px]">{item.emoji}</span>
            <span
              className="flex-1 text-[13px] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {item.label}
            </span>
            <ChevronRight
              size={16}
              style={{ color: "var(--text-muted)" }}
            />
          </button>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="glass-card flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {theme === "dark" ? (
            <Moon size={16} style={{ color: "var(--accent-primary)" }} />
          ) : (
            <Sun size={16} style={{ color: "var(--accent-primary)" }} />
          )}
          <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative h-[28px] w-[48px] rounded-full transition-colors"
          style={{
            background: theme === "dark" ? "var(--gradient-cta)" : "var(--input-border)",
          }}
        >
          <div
            className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform"
            style={{
              transform: theme === "dark" ? "translateX(23px)" : "translateX(3px)",
            }}
          />
        </button>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-[16px] border py-[14px] text-[13px] font-semibold transition-all"
        style={{
          borderColor: "var(--accent-primary)",
          color: "var(--accent-primary)",
          background: "transparent",
        }}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
