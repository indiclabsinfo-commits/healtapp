"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Loader2,
  Smile,
  TrendingUp,
} from "lucide-react";
import { getUserAnalyticsApi } from "@/lib/analytics";

type CategoryScore = {
  name: string;
  score: number;
  color: string;
};

type AnalyticsData = {
  totalAssessments: number;
  avgScore: number;
  theoryCompleted: number;
  weeklyMood: number[];
  categoryBreakdown: CategoryScore[];
  recentAssessments: { id: number; title: string; score: number; date: string }[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CATEGORY_COLORS: Record<string, string> = {
  Anxiety: "var(--accent-primary)",
  Stress: "#FF6B6B",
  "Self-esteem": "#A78BFA",
  Depression: "#FFD93D",
};

function getCategoryColor(name: string, index: number): string {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  const fallback = ["var(--accent-primary)", "#FF6B6B", "#A78BFA", "#FFD93D", "#4ADE80"];
  return fallback[index % fallback.length];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#4ADE80";
  if (score >= 60) return "var(--accent-primary)";
  if (score >= 40) return "#FFD93D";
  return "#FF6B6B";
}

function getMoodAvg(moods: number[]): string {
  if (!moods || moods.length === 0) return "---";
  const logged = moods.filter((m) => m > 0);
  if (logged.length === 0) return "---";
  const sum = logged.reduce((a, b) => a + b, 0);
  return (sum / logged.length).toFixed(1);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await getUserAnalyticsApi();
      setData(res.data || null);
    } catch {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-16 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 text-center text-[13px]" style={{ color: "#FF6B6B" }}>
        {error}
      </div>
    );
  }

  const analytics = data || {
    totalAssessments: 0,
    avgScore: 0,
    theoryCompleted: 0,
    weeklyMood: [],
    categoryBreakdown: [],
    recentAssessments: [],
  };

  const weeklyMood = analytics.weeklyMood || [];
  const maxMood = 5;
  const moodAvg = getMoodAvg(weeklyMood);

  return (
    <div>
      {/* Title */}
      <h1
        className="font-heading text-[22px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Analytics<span style={{ color: "var(--accent-primary)" }}>.</span>
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Your wellness journey data
      </p>

      {/* KPI Cards — 2-column grid */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {/* Assessments */}
        <div className="glass-card p-4 text-center">
          <div
            className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-icon"
            style={{ background: "var(--tag-bg)" }}
          >
            <ClipboardList size={16} style={{ color: "var(--accent-primary)" }} />
          </div>
          <p
            className="font-heading text-[28px] font-bold"
            style={{ color: "var(--accent-primary)" }}
          >
            {analytics.totalAssessments}
          </p>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Assessments
          </p>
        </div>

        {/* Avg Score */}
        <div className="glass-card p-4 text-center">
          <div
            className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-icon"
            style={{ background: "rgba(255,107,107,0.1)" }}
          >
            <TrendingUp size={16} style={{ color: getScoreColor(analytics.avgScore) }} />
          </div>
          <p
            className="font-heading text-[28px] font-bold"
            style={{ color: getScoreColor(analytics.avgScore) }}
          >
            {analytics.avgScore}%
          </p>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Avg Score
          </p>
        </div>

        {/* Theory Completed */}
        <div className="glass-card p-4 text-center">
          <div
            className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-icon"
            style={{ background: "rgba(74,222,128,0.1)" }}
          >
            <BookOpen size={16} style={{ color: "#4ADE80" }} />
          </div>
          <p className="font-heading text-[28px] font-bold" style={{ color: "#4ADE80" }}>
            {analytics.theoryCompleted}
          </p>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Theory Done
          </p>
        </div>

        {/* Mood Average */}
        <div className="glass-card p-4 text-center">
          <div
            className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-icon"
            style={{ background: "rgba(167,139,250,0.1)" }}
          >
            <Smile size={16} style={{ color: "#A78BFA" }} />
          </div>
          <p className="font-heading text-[28px] font-bold" style={{ color: "#A78BFA" }}>
            {moodAvg}
          </p>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Mood Avg
          </p>
        </div>
      </div>

      {/* Weekly Mood Chart */}
      <div className="glass-card mt-5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="font-heading text-[14px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Wellness Trend
          </h3>
          <span className="tag">Last 7 days</span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
          {DAYS.map((day, i) => {
            const value = weeklyMood[i] ?? 0;
            const heightPct = maxMood > 0 ? (value / maxMood) * 100 : 0;
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>
                  {value > 0 ? value : ""}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    background:
                      value > 0
                        ? "var(--gradient-cta)"
                        : "var(--progress-bg)",
                    opacity: value > 0 ? 0.85 : 0.4,
                    minHeight: 4,
                  }}
                />
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Scores */}
      {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
        <div className="mt-5">
          <h3
            className="font-heading mb-3 text-[14px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Category Scores
          </h3>
          <div className="flex flex-col gap-3">
            {analytics.categoryBreakdown.map((cat, idx) => {
              const color = cat.color || getCategoryColor(cat.name, idx);
              return (
                <div key={cat.name} className="glass-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {cat.name}
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color }}>
                      {cat.score}%
                    </span>
                  </div>
                  <div
                    className="h-[3px] w-full overflow-hidden rounded-full"
                    style={{ background: "var(--progress-bg)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.score}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Assessments */}
      {analytics.recentAssessments && analytics.recentAssessments.length > 0 && (
        <div className="mt-5 mb-4">
          <h3
            className="font-heading mb-3 text-[14px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Assessments
          </h3>
          <div className="flex flex-col gap-2">
            {analytics.recentAssessments.map((a) => (
              <div key={a.id} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {new Date(a.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="font-heading text-[18px] font-bold"
                  style={{ color: getScoreColor(a.score) }}
                >
                  {a.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
