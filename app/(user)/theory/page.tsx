"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  X,
} from "lucide-react";
import { listTheoryApi, getProgressApi, updateProgressApi } from "@/lib/theory";

type Module = {
  id: number;
  title: string;
  content?: string;
};

type TheorySession = {
  id: number;
  title: string;
  description: string;
  modules: Module[];
  duration: number;
  status: string;
};

type ProgressData = {
  completedModules: number[];
  completed: boolean;
};

export default function TheoryPage() {
  const [sessions, setSessions] = useState<TheorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressMap, setProgressMap] = useState<Record<number, ProgressData>>({});

  // Detail view
  const [selectedSession, setSelectedSession] = useState<TheorySession | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      setLoading(true);
      const res = await listTheoryApi({ status: "published" });
      const data: TheorySession[] = res.data || [];
      setSessions(data);

      // Fetch progress for each session
      const progMap: Record<number, ProgressData> = {};
      await Promise.all(
        data.map(async (s) => {
          try {
            const pRes = await getProgressApi(s.id);
            if (pRes.data) {
              progMap[s.id] = {
                completedModules: pRes.data.completedModules || [],
                completed: pRes.data.completed || false,
              };
            }
          } catch {
            // no progress yet
          }
        })
      );
      setProgressMap(progMap);
    } catch {
      setError("Failed to load theory sessions");
    } finally {
      setLoading(false);
    }
  }

  function getProgress(sessionId: number, totalModules: number) {
    const prog = progressMap[sessionId];
    if (!prog || totalModules === 0) return { percent: 0, label: "Start" };
    if (prog.completed) return { percent: 100, label: "Done" };
    const pct = Math.round((prog.completedModules.length / totalModules) * 100);
    return { percent: pct, label: pct > 0 ? `${pct}%` : "Start" };
  }

  function getProgressColor(percent: number): string {
    if (percent >= 100) return "#4ADE80"; // green
    if (percent > 0) return "var(--accent-primary)";
    return "var(--text-muted)";
  }

  async function handleToggleModule(session: TheorySession, moduleId: number) {
    const prog = progressMap[session.id] || { completedModules: [], completed: false };
    let newCompleted: number[];

    if (prog.completedModules.includes(moduleId)) {
      newCompleted = prog.completedModules.filter((id) => id !== moduleId);
    } else {
      newCompleted = [...prog.completedModules, moduleId];
    }

    const allDone = newCompleted.length === (session.modules?.length || 0);

    const newProg = { completedModules: newCompleted, completed: allDone };
    setProgressMap((prev) => ({ ...prev, [session.id]: newProg }));

    try {
      setSaving(true);
      await updateProgressApi(session.id, newProg);
    } catch {
      // revert on error
      setProgressMap((prev) => ({ ...prev, [session.id]: prog }));
    } finally {
      setSaving(false);
    }
  }

  function getModules(session: TheorySession): Module[] {
    if (!session.modules) return [];
    if (Array.isArray(session.modules)) return session.modules;
    // Handle if modules is a JSON string
    try {
      return typeof session.modules === "string"
        ? JSON.parse(session.modules)
        : [];
    } catch {
      return [];
    }
  }

  // --- Detail view ---
  if (selectedSession) {
    const modules = getModules(selectedSession);
    const prog = progressMap[selectedSession.id] || { completedModules: [], completed: false };
    const { percent } = getProgress(selectedSession.id, modules.length);

    return (
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center">
          <button onClick={() => setSelectedSession(null)} className="mr-3 p-1">
            <ArrowLeft size={18} style={{ color: "var(--text-muted)" }} />
          </button>
          <h2
            className="flex-1 text-center text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}
          >
            {selectedSession.title}
          </h2>
          <button onClick={() => setSelectedSession(null)} className="p-1">
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Progress summary */}
        <div className="glass-card mb-5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Progress
            </span>
            <span className="text-[11px] font-medium" style={{ color: getProgressColor(percent) }}>
              {percent}%
            </span>
          </div>
          <div
            className="h-[3px] w-full overflow-hidden rounded-full"
            style={{ background: "var(--progress-bg)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                background: percent >= 100 ? "#4ADE80" : "var(--gradient-cta)",
              }}
            />
          </div>
        </div>

        {/* Description */}
        <p className="mb-5 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {selectedSession.description}
        </p>

        {/* Modules list */}
        <h3
          className="mb-3 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Modules ({modules.length})
        </h3>
        <div className="flex flex-col gap-2">
          {modules.map((mod, idx) => {
            const isChecked = prog.completedModules.includes(mod.id ?? idx);
            return (
              <button
                key={mod.id ?? idx}
                onClick={() => handleToggleModule(selectedSession, mod.id ?? idx)}
                disabled={saving}
                className="glass-card flex items-center gap-3 p-4 text-left"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: isChecked ? "var(--accent-primary)" : "var(--border-card)",
                    background: isChecked ? "var(--tag-bg)" : "transparent",
                  }}
                >
                  {isChecked ? (
                    <CheckCircle2 size={16} style={{ color: "var(--accent-primary)" }} />
                  ) : (
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {idx + 1}
                    </span>
                  )}
                </div>
                <span
                  className="flex-1 text-[13px] font-medium"
                  style={{
                    color: isChecked ? "var(--accent-primary)" : "var(--text-primary)",
                    textDecoration: isChecked ? "line-through" : "none",
                    opacity: isChecked ? 0.7 : 1,
                  }}
                >
                  {mod.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div>
      {/* Title */}
      <h1
        className="font-heading text-[22px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Theory<span style={{ color: "var(--accent-primary)" }}>.</span>
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Learn at your own pace
      </p>

      {/* Loading */}
      {loading && (
        <div className="mt-16 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 text-center text-[13px]" style={{ color: "#FF6B6B" }}>
          {error}
        </div>
      )}

      {/* Session cards */}
      {!loading && !error && (
        <div className="mt-5 flex flex-col gap-[14px]">
          {sessions.length === 0 && (
            <p className="mt-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              No theory sessions available
            </p>
          )}
          {sessions.map((session) => {
            const modules = getModules(session);
            const { percent, label } = getProgress(session.id, modules.length);
            const progressColor = getProgressColor(percent);

            return (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="glass-card flex items-center gap-3 p-4 text-left"
              >
                {/* Icon */}
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-icon"
                  style={{ background: "var(--tag-bg)" }}
                >
                  <BookOpen size={22} style={{ color: "var(--accent-primary)" }} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[14px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {session.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      <Layers size={10} />
                      {modules.length} modules
                    </span>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      <Clock size={10} />
                      {session.duration} min
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="h-[3px] flex-1 overflow-hidden rounded-full"
                      style={{ background: "var(--progress-bg)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          background: percent >= 100 ? "#4ADE80" : "var(--gradient-cta)",
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: progressColor }}
                    >
                      {label}
                    </span>
                  </div>
                </div>

                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
