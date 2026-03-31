"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { logMoodApi, getMoodHistoryApi } from "@/lib/mood";
import api from "@/lib/api";
import {
  ClipboardList,
  UserCircle,
  Wind,
  BookOpen,
  BarChart3,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const MOODS = [
  { value: 1, emoji: "\uD83D\uDE22", label: "Awful" },
  { value: 2, emoji: "\uD83D\uDE1F", label: "Bad" },
  { value: 3, emoji: "\uD83D\uDE10", label: "Okay" },
  { value: 4, emoji: "\uD83D\uDE42", label: "Good" },
  { value: 5, emoji: "\uD83D\uDE04", label: "Great" },
];

const QUICK_ACTIONS = [
  {
    icon: ClipboardList,
    emoji: "\uD83D\uDCCB",
    title: "Assessment",
    subtitle: "Take a quiz",
    href: "/assessment",
    color: "rgba(111,255,233,0.12)",
  },
  {
    icon: UserCircle,
    emoji: "\uD83D\uDC64",
    title: "Counsellors",
    subtitle: "Find experts",
    href: "/counsellors",
    color: "rgba(255,107,107,0.12)",
  },
  {
    icon: Wind,
    emoji: "\uD83C\uDF2C\uFE0F",
    title: "Breathing",
    subtitle: "Calm your mind",
    href: "/breathing",
    color: "rgba(167,139,250,0.12)",
  },
  {
    icon: BookOpen,
    emoji: "\uD83D\uDCD6",
    title: "Theory",
    subtitle: "Learn more",
    href: "/theory",
    color: "rgba(74,222,128,0.12)",
  },
];

export default function UserDashboard() {
  const user = useAuthStore((s) => s.user);

  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodLogged, setMoodLogged] = useState(false);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [recentMoods, setRecentMoods] = useState<Array<{ mood: number; date: string }>>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    async function checkTodayMood() {
      try {
        const res = await getMoodHistoryApi(7);
        if (res.success && res.data && res.data.length > 0) {
          setRecentMoods(res.data.slice(0, 7));
          const latest = res.data[0];
          const loggedDate = new Date(latest.date).toDateString();
          const today = new Date().toDateString();
          if (loggedDate === today) {
            setTodayMood(latest.mood);
            setSelectedMood(latest.mood);
            setMoodLogged(true);
          }
        }
      } catch {
        // Silently fail
      }
    }
    checkTodayMood();
  }, []);

  const memberships = useAuthStore((s) => s.memberships);
  const primaryMembership = memberships[0];
  const orgId = primaryMembership?.organization?.id;

  useEffect(() => {
    if (!orgId) return;
    async function fetchAssignments() {
      setAssignmentsLoading(true);
      try {
        const res = await api.get("/assignments/my", { params: { orgId } });
        setAssignments((res.data.data || []).filter((a: any) => !a.completed));
      } catch {
        // silently fail
      } finally {
        setAssignmentsLoading(false);
      }
    }
    fetchAssignments();
  }, [orgId]);

  const handleMoodSelect = async (mood: number) => {
    if (moodLogged && todayMood === mood) return;
    setSelectedMood(mood);
    setMoodLoading(true);
    try {
      await logMoodApi(mood);
      setMoodLogged(true);
      setTodayMood(mood);
    } catch {
      setSelectedMood(todayMood);
    } finally {
      setMoodLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {getGreeting()}
        </p>
        <h1
          className="font-heading text-[22px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {user?.name || "User"} {"\u2728"}
        </h1>
      </div>

      {/* Org + Credits Banner */}
      {primaryMembership && (
        <div className="glass-card flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{primaryMembership.organization.type === "SCHOOL" ? "\uD83C\uDFEB" : "\uD83C\uDFE2"}</span>
            <div>
              <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                {primaryMembership.organization.name}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {primaryMembership.role === "STUDENT" ? `Class ${primaryMembership.class || "—"}` : primaryMembership.department || primaryMembership.role}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-[18px] font-bold" style={{ color: "var(--accent-primary)" }}>
              {primaryMembership.creditBalance}
            </p>
            <p className="text-[9px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Credits</p>
          </div>
        </div>
      )}

      {/* Assigned Tasks */}
      {!assignmentsLoading && assignments.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Assigned Tasks
            </h2>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {assignments.length} pending
            </span>
          </div>
          <div className="space-y-2">
            {assignments.map((a: any) => (
              <Link
                key={a.id}
                href={a.type === "ASSESSMENT" ? `/assessment?qid=${a.questionnaireId}` : `/theory/${a.theorySessionId}`}
              >
                <div className="glass-card flex items-center gap-3 p-3 transition-all hover:scale-[1.01]">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px]"
                    style={{
                      background: a.type === "ASSESSMENT" ? "rgba(111,255,233,0.12)" : "rgba(167,139,250,0.12)",
                      color: a.type === "ASSESSMENT" ? "#6FFFE9" : "#A78BFA",
                    }}
                  >
                    {a.type === "ASSESSMENT" ? <ClipboardList size={14} /> : <BookOpen size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {a.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block rounded-pill px-1.5 py-0.5 text-[8px] font-medium"
                        style={{
                          background: a.type === "ASSESSMENT" ? "rgba(111,255,233,0.1)" : "rgba(167,139,250,0.1)",
                          color: a.type === "ASSESSMENT" ? "#6FFFE9" : "#A78BFA",
                          border: `1px solid ${a.type === "ASSESSMENT" ? "rgba(111,255,233,0.15)" : "rgba(167,139,250,0.15)"}`,
                        }}
                      >
                        {a.type}
                      </span>
                      {a.deadline && (
                        <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                          <Calendar size={8} /> {new Date(a.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {a.mandatory && (
                        <span
                          className="inline-block rounded-pill px-1.5 py-0.5 text-[8px] font-medium uppercase"
                          style={{
                            background: "rgba(255,107,107,0.1)",
                            color: "#FF6B6B",
                            border: "1px solid rgba(255,107,107,0.15)",
                          }}
                        >
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mood Check-in */}
      <div className="glass-card p-4">
        <p
          className="mb-3 text-[11px] tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          {moodLogged ? "Today's mood logged" : "How are you feeling today?"}
        </p>
        <div className="flex items-center justify-between gap-2">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.value;
            return (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={moodLoading}
                className="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] text-xl transition-all"
                style={{
                  background: isSelected ? "var(--pill-active-bg)" : "transparent",
                  border: isSelected ? "1px solid var(--pill-active-border)" : "1px solid transparent",
                  opacity: moodLoading ? 0.5 : 1,
                  transform: isSelected ? "scale(1.1)" : "scale(1)",
                }}
                aria-label={mood.label}
              >
                {mood.emoji}
              </button>
            );
          })}
        </div>
        {moodLogged && (
          <p className="mt-2 text-center text-[10px]" style={{ color: "var(--accent-primary)" }}>
            {"\u2713"} Mood recorded
          </p>
        )}
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href}>
            <div className="glass-card p-4 transition-all hover:scale-[1.02]">
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-[12px] text-lg"
                style={{ background: action.color }}
              >
                {action.emoji}
              </div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {action.title}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {action.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Weekly Mood Trend */}
      {recentMoods.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Your Week
            </h2>
            <Link href="/analytics" className="text-[11px] font-medium" style={{ color: "var(--accent-primary)" }}>
              View Analytics →
            </Link>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-end justify-between gap-2" style={{ height: "80px" }}>
              {recentMoods.slice(0, 7).reverse().map((m, i) => {
                const heightPct = (m.mood / 5) * 100;
                const day = new Date(m.date).toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-[6px]"
                      style={{
                        height: `${heightPct}%`,
                        background: "var(--gradient-cta)",
                        minHeight: "8px",
                        opacity: 0.7 + (m.mood / 5) * 0.3,
                      }}
                    />
                    <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
