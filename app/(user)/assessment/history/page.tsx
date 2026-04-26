"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyAssessmentsApi } from "@/lib/assessments";
import { Brain, HeartPulse, ArrowLeft, Calendar, TrendingUp } from "lucide-react";

function detectType(title: string): "PHQ9" | "GAD7" | null {
  if (title.toLowerCase().includes("phq")) return "PHQ9";
  if (title.toLowerCase().includes("gad")) return "GAD7";
  return null;
}

const META = {
  PHQ9: {
    name: "Depression Screening",
    shortName: "PHQ-9",
    color: "#A78BFA",
    icon: Brain,
    levels: [
      { label: "Minimal", color: "#4ADE80", min: 0, max: 14 },
      { label: "Mild", color: "#FFD93D", min: 15, max: 33 },
      { label: "Moderate", color: "#FF9F40", min: 34, max: 52 },
      { label: "Moderately Severe", color: "#F97316", min: 53, max: 70 },
      { label: "Severe", color: "#FF6B6B", min: 71, max: 100 },
    ],
  },
  GAD7: {
    name: "Anxiety Screening",
    shortName: "GAD-7",
    color: "#6FFFE9",
    icon: HeartPulse,
    levels: [
      { label: "Minimal", color: "#4ADE80", min: 0, max: 19 },
      { label: "Mild", color: "#FFD93D", min: 20, max: 43 },
      { label: "Moderate", color: "#FF9F40", min: 44, max: 67 },
      { label: "Severe", color: "#FF6B6B", min: 68, max: 100 },
    ],
  },
};

function getLevel(type: "PHQ9" | "GAD7", pct: number) {
  const levels = META[type].levels;
  return levels.find((l) => pct >= l.min && pct <= l.max) ?? levels[levels.length - 1];
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AssessmentHistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAssessmentsApi({ limit: 50 })
      .then((r) => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          <h1 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Assessment History
          </h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>All your past screening results</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ borderRadius: "20px" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px]" style={{ background: "var(--tag-bg)" }}>
            <TrendingUp size={22} style={{ color: "var(--accent-primary)" }} />
          </div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>No assessments yet</p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>Complete a screening to see your results here.</p>
          <button
            onClick={() => router.push("/assessment")}
            className="cta-button mt-5"
            style={{ maxWidth: "200px", margin: "20px auto 0" }}
          >
            Take Assessment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const type = detectType(item.questionnaire?.title ?? "");
            const meta = type ? META[type] : null;
            const Icon = meta?.icon ?? Brain;
            const level = type ? getLevel(type, item.score) : null;

            return (
              <div key={item.id} className="glass-card p-4" style={{ borderRadius: "16px" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: meta ? `${meta.color}18` : "var(--tag-bg)" }}
                  >
                    <Icon size={18} style={{ color: meta?.color ?? "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {meta?.name ?? item.questionnaire?.title ?? "Assessment"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Calendar size={10} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{fmt(item.completedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {level && (
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${level.color}20`, color: level.color }}
                      >
                        {level.label}
                      </span>
                    )}
                    <p className="mt-1 text-[11px] font-bold" style={{ color: meta?.color ?? "var(--accent-primary)" }}>
                      {Math.round(item.score)}%
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--progress-bg)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.score}%`, background: level?.color ?? "var(--accent-primary)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
