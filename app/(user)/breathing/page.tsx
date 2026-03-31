"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Heart,
  Play,
  Pause,
  Wind,
  Timer,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { listBreathingApi, toggleFavouriteApi, logCompletionApi } from "@/lib/breathing";

type Exercise = {
  id: number;
  name: string;
  description: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  holdAfterExhale: number;
  defaultCycles: number;
  category: string;
  isFavourite?: boolean;
};

type Phase = "inhale" | "hold" | "exhale" | "holdAfterExhale";

export default function BreathingPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Exercise mode state
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [totalCycles, setTotalCycles] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStart, setSessionStart] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  async function fetchExercises() {
    try {
      setLoading(true);
      const res = await listBreathingApi();
      setExercises(res.data || []);
    } catch {
      setError("Failed to load breathing exercises");
    } finally {
      setLoading(false);
    }
  }

  const categories = ["All", ...Array.from(new Set(exercises.map((e) => e.category)))];

  const filtered =
    selectedCategory === "All"
      ? exercises
      : exercises.filter((e) => e.category === selectedCategory);

  async function handleToggleFavourite(id: number) {
    try {
      await toggleFavouriteApi(id);
      setExercises((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, isFavourite: !e.isFavourite } : e
        )
      );
    } catch {
      // silent fail
    }
  }

  // --- Exercise mode logic ---

  function getPhaseSeconds(ex: Exercise, p: Phase): number {
    switch (p) {
      case "inhale":
        return ex.inhaleSeconds;
      case "hold":
        return ex.holdSeconds;
      case "exhale":
        return ex.exhaleSeconds;
      case "holdAfterExhale":
        return ex.holdAfterExhale;
    }
  }

  function getNextPhase(p: Phase, ex: Exercise): { phase: Phase; nextCycle: boolean } {
    switch (p) {
      case "inhale":
        return ex.holdSeconds > 0
          ? { phase: "hold", nextCycle: false }
          : { phase: "exhale", nextCycle: false };
      case "hold":
        return { phase: "exhale", nextCycle: false };
      case "exhale":
        return ex.holdAfterExhale > 0
          ? { phase: "holdAfterExhale", nextCycle: false }
          : { phase: "inhale", nextCycle: true };
      case "holdAfterExhale":
        return { phase: "inhale", nextCycle: true };
    }
  }

  const advancePhase = useCallback(() => {
    if (!activeExercise) return;

    const { phase: nextPhase, nextCycle } = getNextPhase(phase, activeExercise);

    if (nextCycle) {
      if (currentCycle >= totalCycles) {
        // Completed all cycles
        if (timerRef.current) clearInterval(timerRef.current);
        const duration = Math.round((Date.now() - sessionStart) / 1000);
        setSessionDuration(duration);
        setIsComplete(true);
        logCompletionApi({
          exerciseId: activeExercise.id,
          cycles: totalCycles,
          durationSec: duration,
        }).catch(() => {});
        return;
      }
      setCurrentCycle((c) => c + 1);
    }

    const nextSec = getPhaseSeconds(activeExercise, nextPhase);
    if (nextSec === 0) {
      // skip phases with 0 seconds
      setPhase(nextPhase);
      // We need to schedule another advance immediately
      setTimeout(() => advancePhase(), 50);
      return;
    }

    setPhase(nextPhase);
    setSecondsLeft(nextSec);
  }, [activeExercise, phase, currentCycle, totalCycles, sessionStart]);

  // Tick timer
  useEffect(() => {
    if (!activeExercise || isPaused || isComplete) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0; // will trigger advancePhase via effect
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExercise, isPaused, isComplete, phase, currentCycle]);

  // When secondsLeft reaches 0, advance
  useEffect(() => {
    if (activeExercise && !isPaused && !isComplete && secondsLeft === 0) {
      advancePhase();
    }
  }, [secondsLeft, activeExercise, isPaused, isComplete, advancePhase]);

  function startExercise(ex: Exercise) {
    setActiveExercise(ex);
    setPhase("inhale");
    setSecondsLeft(ex.inhaleSeconds);
    setCurrentCycle(1);
    setTotalCycles(ex.defaultCycles);
    setIsPaused(false);
    setIsComplete(false);
    setSessionStart(Date.now());
    setSessionDuration(0);
  }

  function exitExercise() {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveExercise(null);
    setIsComplete(false);
  }

  function getPhaseLabel(p: Phase): string {
    switch (p) {
      case "inhale":
        return "INHALE";
      case "hold":
      case "holdAfterExhale":
        return "HOLD";
      case "exhale":
        return "EXHALE";
    }
  }

  function getCircleScale(): number {
    if (!activeExercise) return 1;
    const total = getPhaseSeconds(activeExercise, phase);
    if (total === 0) return 1;
    const elapsed = total - secondsLeft;
    const progress = elapsed / total;

    switch (phase) {
      case "inhale":
        return 0.6 + 0.4 * progress; // scale 0.6 -> 1.0
      case "hold":
        return 1.0;
      case "exhale":
        return 1.0 - 0.4 * progress; // scale 1.0 -> 0.6
      case "holdAfterExhale":
        return 0.6;
    }
  }

  function getTotalPhaseSeconds(ex: Exercise): number {
    return ex.inhaleSeconds + ex.holdSeconds + ex.exhaleSeconds + ex.holdAfterExhale;
  }

  function getOverallProgress(): number {
    if (!activeExercise || totalCycles === 0) return 0;
    const cycleLen = getTotalPhaseSeconds(activeExercise);
    if (cycleLen === 0) return 0;

    // How much of the current cycle is done
    let phasesOrder: Phase[] = ["inhale", "hold", "exhale", "holdAfterExhale"];
    let elapsedInCycle = 0;
    for (const p of phasesOrder) {
      if (p === phase) {
        const total = getPhaseSeconds(activeExercise, p);
        elapsedInCycle += total - secondsLeft;
        break;
      } else {
        elapsedInCycle += getPhaseSeconds(activeExercise, p);
      }
    }

    const completedCycleSec = (currentCycle - 1) * cycleLen + elapsedInCycle;
    const totalSec = totalCycles * cycleLen;
    return Math.min((completedCycleSec / totalSec) * 100, 100);
  }

  function formatTiming(ex: Exercise): string {
    const parts = [ex.inhaleSeconds, ex.holdSeconds, ex.exhaleSeconds];
    if (ex.holdAfterExhale > 0) parts.push(ex.holdAfterExhale);
    return parts.map((s) => `${s}s`).join("-");
  }

  function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  // --- Completion screen ---
  if (activeExercise && isComplete) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--tag-bg)" }}
        >
          <CheckCircle2 size={40} style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1
          className="font-heading text-[24px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Well Done!
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          You completed {totalCycles} cycles of {activeExercise.name}
        </p>
        <div className="mt-6 flex gap-6">
          <div className="text-center">
            <p
              className="font-heading text-[28px] font-bold"
              style={{ color: "var(--accent-primary)" }}
            >
              {totalCycles}
            </p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Cycles
            </p>
          </div>
          <div className="text-center">
            <p
              className="font-heading text-[28px] font-bold"
              style={{ color: "var(--accent-primary)" }}
            >
              {formatDuration(sessionDuration)}
            </p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Duration
            </p>
          </div>
        </div>
        <button className="cta-button mt-8 max-w-[280px]" onClick={exitExercise}>
          Back to Exercises
        </button>
      </div>
    );
  }

  // --- Exercise mode (animated guide) ---
  if (activeExercise) {
    const scale = getCircleScale();
    const progress = getOverallProgress();

    return (
      <div className="flex min-h-[70vh] flex-col items-center">
        {/* Header */}
        <div className="mb-8 flex w-full items-center">
          <button onClick={exitExercise} className="mr-3 p-1">
            <ArrowLeft size={18} style={{ color: "var(--text-muted)" }} />
          </button>
          <h2
            className="flex-1 text-center text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}
          >
            {activeExercise.name}
          </h2>
          <div style={{ width: 26 }} />
        </div>

        {/* Cycle counter */}
        <p className="mb-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
          Cycle {currentCycle} of {totalCycles}
        </p>

        {/* Animated breathing circle */}
        <div className="relative my-8 flex h-[200px] w-[200px] items-center justify-center">
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full transition-transform duration-1000 ease-in-out"
            style={{
              transform: `scale(${scale})`,
              background: "var(--accent-primary)",
              opacity: 0.08,
              filter: "blur(30px)",
            }}
          />
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 transition-transform duration-1000 ease-in-out"
            style={{
              transform: `scale(${scale})`,
              borderColor: "var(--accent-primary)",
              opacity: 0.25,
            }}
          />
          {/* Inner circle */}
          <div
            className="absolute rounded-full transition-transform duration-1000 ease-in-out"
            style={{
              width: 160,
              height: 160,
              left: 20,
              top: 20,
              transform: `scale(${scale})`,
              background: "var(--accent-primary)",
              opacity: 0.12,
            }}
          />
          {/* Phase text */}
          <div className="z-10 flex flex-col items-center">
            <span
              className="text-[28px] font-bold tracking-wider"
              style={{ color: "var(--accent-primary)" }}
            >
              {getPhaseLabel(phase)}
            </span>
            <span
              className="font-heading text-[48px] font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-6 w-full max-w-[280px]">
          <div
            className="h-[3px] w-full overflow-hidden rounded-full"
            style={{ background: "var(--progress-bg)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: "var(--gradient-cta)",
              }}
            />
          </div>
          <p className="mt-2 text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Pause/Resume */}
        <button
          onClick={() => setIsPaused((p) => !p)}
          className="glass-card flex items-center gap-2 px-6 py-3"
        >
          {isPaused ? (
            <Play size={16} style={{ color: "var(--accent-primary)" }} />
          ) : (
            <Pause size={16} style={{ color: "var(--accent-primary)" }} />
          )}
          <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
            {isPaused ? "Resume" : "Pause"}
          </span>
        </button>
      </div>
    );
  }

  // --- Browse mode ---
  return (
    <div>
      {/* Title */}
      <h1
        className="font-heading text-[22px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Breathe<span style={{ color: "var(--accent-primary)" }}>.</span>
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Calm your mind with guided breathing
      </p>

      {/* Category filter pills */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cat === selectedCategory ? "pill-active" : "pill-inactive"}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-16 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 text-center text-[13px]" style={{ color: "var(--accent-red, #FF6B6B)" }}>
          {error}
        </div>
      )}

      {/* Exercise cards */}
      {!loading && !error && (
        <div className="mt-5 flex flex-col gap-3">
          {filtered.length === 0 && (
            <p className="mt-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              No exercises found
            </p>
          )}
          {filtered.map((ex) => (
            <div key={ex.id} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-icon"
                    style={{ background: "var(--tag-bg)" }}
                  >
                    <Wind size={22} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div>
                    <h3
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {ex.name}
                    </h3>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {ex.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="tag">{ex.category}</span>
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <Timer size={10} />
                        {formatTiming(ex)}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {ex.defaultCycles} cycles
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleFavourite(ex.id)}
                  aria-label={ex.isFavourite ? "Remove from favourites" : "Add to favourites"}
                  className="ml-2 flex-shrink-0 p-1"
                >
                  <Heart
                    size={18}
                    fill={ex.isFavourite ? "var(--accent-primary)" : "none"}
                    style={{
                      color: ex.isFavourite
                        ? "var(--accent-primary)"
                        : "var(--text-muted)",
                    }}
                  />
                </button>
              </div>
              <button
                onClick={() => startExercise(ex)}
                className="cta-button mt-4 flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Start Exercise
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
