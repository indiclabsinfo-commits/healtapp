"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import {
  Search,
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  BookOpen,
  Users,
  Zap,
  Heart,
  Loader2,
} from "lucide-react";

interface Student {
  id: number;
  role: string;
  class?: string | null;
  user: { id: number; name: string; email: string };
}

const AREAS = [
  { key: "ACADEMIC", label: "Academic", icon: BookOpen, color: "#60A5FA", bg: "rgba(96,165,250,0.15)" },
  { key: "SOCIAL", label: "Social", icon: Users, color: "#F87171", bg: "rgba(248,113,113,0.15)" },
  { key: "BEHAVIORAL", label: "Behaviour", icon: Zap, color: "#FBBF24", bg: "rgba(251,191,36,0.15)" },
  { key: "EMOTIONAL", label: "Emotional", icon: Heart, color: "#F472B6", bg: "rgba(244,114,182,0.15)" },
];

const CONCERNS: Record<string, string[]> = {
  ACADEMIC: ["Not paying attention", "Easily distracted", "Not completing work", "Forgetful", "Needs repeated instructions"],
  SOCIAL: ["Avoiding peers", "Conflict with classmates", "Isolation / withdrawal", "Disruptive in groups", "Excessive attention-seeking"],
  BEHAVIORAL: ["Angry outbursts", "Defiant behavior", "Hyperactive / restless", "Disruptive in class", "Breaking rules"],
  EMOTIONAL: ["Appears anxious", "Frequently tearful", "Low mood", "Sudden mood changes", "Appears stressed"],
};

const CONTEXT_OPTIONS = ["Seen recently", "Few days", "Long time"];

export default function NoticeChangePage() {
  const router = useRouter();
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships?.[0]?.organization?.id;

  const [step, setStep] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [quickContext, setQuickContext] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("MODERATE");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orgId) fetchStudents();
  }, [orgId]);

  async function fetchStudents() {
    setLoadingStudents(true);
    try {
      const res = await api.get(`/organizations/${orgId}/members`, {
        params: { role: "STUDENT", limit: 200 },
      });
      setStudents(res.data.data || []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  const filteredStudents = students.filter((s) =>
    s.user.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggleArea(key: string) {
    setSelectedAreas((prev) => {
      if (prev.includes(key)) return prev.filter((a) => a !== key);
      if (prev.length >= 2) return prev;
      return [...prev, key];
    });
  }

  function toggleConcern(c: string) {
    setSelectedConcerns((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= 3) return prev;
      return [...prev, c];
    });
  }

  const allConcernOptions = selectedAreas.flatMap((a) => CONCERNS[a] || []);

  async function handleSubmit(connect: boolean) {
    if (!connect) { router.push("/admin/students"); return; }
    if (!selectedStudent || !orgId) return;
    setSubmitting(true);
    setError("");
    try {
      const primaryArea = selectedAreas[0] || "ACADEMIC";
      const notes = [
        ...selectedConcerns,
        quickContext ? `Duration: ${quickContext}` : "",
      ]
        .filter(Boolean)
        .join(". ");

      await api.post(
        `/behavior-logs?orgId=${orgId}`,
        {
          studentId: selectedStudent.user.id,
          category: primaryArea,
          severity: selectedSeverity,
          notes: notes || "Noticed a change — flagged for counsellor review.",
          flagForCounseling: true,
        }
      );
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div>
        <AdminTopbar title="Notice a Change" subtitle="Student flagged for counsellor support" />
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(74,222,128,0.15)" }}
          >
            <CheckCircle size={32} style={{ color: "#4ADE80" }} />
          </div>
          <h2 className="font-heading text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Student Connected!
          </h2>
          <p className="mt-2 max-w-xs text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            {selectedStudent?.user.name} has been flagged for counsellor support. The counsellor will follow up shortly.
          </p>
          <button
            onClick={() => { setStep(1); setSelectedStudent(null); setSelectedAreas([]); setSelectedConcerns([]); setQuickContext(""); setDone(false); }}
            className="cta-button mt-8 px-8"
          >
            Flag Another Student
          </button>
          <button
            onClick={() => router.push("/admin/students")}
            className="mt-3 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminTopbar
        title="Notice a Change"
        subtitle={`Step ${step} of 4 — Takes less than 30 seconds`}
      />

      <div className="mx-auto max-w-lg px-6 py-8">
        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{
                background: s <= step ? "var(--accent-primary)" : "var(--border-card)",
              }}
            />
          ))}
        </div>

        {/* STEP 1 — Select Student */}
        {step === 1 && (
          <div>
            <h2 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Which student?
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
              Search or select from your class
            </p>

            <div className="relative mt-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field w-full pl-9"
              />
            </div>

            <div className="mt-3 space-y-2">
              {loadingStudents ? (
                <div className="py-6 text-center">
                  <Loader2 size={20} className="mx-auto animate-spin" style={{ color: "var(--accent-primary)" }} />
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="py-4 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                  No students found
                </p>
              ) : (
                filteredStudents.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 transition-all"
                    style={{
                      background: selectedStudent?.id === s.id ? "var(--pill-active-bg)" : "var(--bg-card)",
                      border: selectedStudent?.id === s.id
                        ? "1px solid var(--accent-primary)"
                        : "1px solid var(--border-card)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold"
                      style={{ background: "var(--gradient-cta)", color: "var(--cta-text)" }}
                    >
                      {s.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {s.user.name}
                      </p>
                      {s.class && (
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          Class {s.class}
                        </p>
                      )}
                    </div>
                    {selectedStudent?.id === s.id && (
                      <CheckCircle size={16} style={{ color: "var(--accent-primary)" }} />
                    )}
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => { if (selectedStudent) setStep(2); }}
              disabled={!selectedStudent}
              className="cta-button mt-6 w-full"
              style={{ opacity: selectedStudent ? 1 : 0.4 }}
            >
              Next <ChevronRight size={16} className="inline" />
            </button>
          </div>
        )}

        {/* STEP 2 — Choose Areas */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
              What are you noticing?
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
              Choose the areas — select 1–2
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {AREAS.map((area) => {
                const Icon = area.icon;
                const selected = selectedAreas.includes(area.key);
                return (
                  <button
                    key={area.key}
                    onClick={() => toggleArea(area.key)}
                    className="flex flex-col items-center justify-center gap-2 rounded-[18px] py-6 transition-all"
                    style={{
                      background: selected ? area.bg : "var(--bg-card)",
                      border: selected ? `2px solid ${area.color}` : "2px solid var(--border-card)",
                      color: selected ? area.color : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={24} />
                    <span className="text-[14px] font-semibold">{area.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
              — Select 1–2 areas —
            </p>

            <button
              onClick={() => { setSelectedConcerns([]); if (selectedAreas.length > 0) setStep(3); }}
              disabled={selectedAreas.length === 0}
              className="cta-button mt-6 w-full"
              style={{ opacity: selectedAreas.length > 0 ? 1 : 0.4 }}
            >
              Continue <ChevronRight size={16} className="inline" />
            </button>
          </div>
        )}

        {/* STEP 3 — Specific Concerns */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="mb-4 flex items-center gap-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {selectedAreas.map((a) => AREAS.find((x) => x.key === a)?.label).join(" & ")} Concerns
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
              Select up to 3 specific observations
            </p>

            <div className="mt-4 space-y-2">
              {allConcernOptions.map((concern) => {
                const selected = selectedConcerns.includes(concern);
                return (
                  <button
                    key={concern}
                    onClick={() => toggleConcern(concern)}
                    className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-all"
                    style={{
                      background: selected ? "rgba(111,255,233,0.08)" : "var(--bg-card)",
                      border: selected ? "1px solid rgba(111,255,233,0.4)" : "1px solid var(--border-card)",
                    }}
                  >
                    <div
                      className="h-4 w-4 flex-shrink-0 rounded"
                      style={{
                        background: selected ? "var(--accent-primary)" : "transparent",
                        border: selected ? "none" : "1.5px solid var(--border-card)",
                      }}
                    />
                    <span className="text-[13px]" style={{ color: selected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {concern}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Context */}
            <div className="mt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                — Quick Context —
              </p>
              <div className="flex gap-2">
                {CONTEXT_OPTIONS.map((ctx) => (
                  <button
                    key={ctx}
                    onClick={() => setQuickContext(quickContext === ctx ? "" : ctx)}
                    className="rounded-pill px-4 py-1.5 text-[12px] transition-all"
                    style={{
                      background: quickContext === ctx ? "var(--pill-active-bg)" : "var(--bg-card)",
                      color: quickContext === ctx ? "var(--accent-primary)" : "var(--text-muted)",
                      border: quickContext === ctx ? "1px solid var(--accent-primary)" : "1px solid var(--border-card)",
                    }}
                  >
                    {ctx}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { if (selectedConcerns.length > 0) setStep(4); }}
              disabled={selectedConcerns.length === 0}
              className="cta-button mt-6 w-full"
              style={{ opacity: selectedConcerns.length > 0 ? 1 : 0.4 }}
            >
              Share for Support <ChevronRight size={16} className="inline" />
            </button>
          </div>
        )}

        {/* STEP 4 — Confirm & Share */}
        {step === 4 && (
          <div>
            <button onClick={() => setStep(3)} className="mb-4 flex items-center gap-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Confirm & Share
            </h2>

            <div className="mt-6 rounded-[20px] p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>You noticed:</p>
              <p className="mt-2 text-[16px] font-semibold" style={{ color: "var(--accent-primary)" }}>
                {selectedConcerns.map((c) => `"${c}"`).join(" and ")}
              </p>
              {quickContext && (
                <p className="mt-3 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  When: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{quickContext}</span>
                </p>
              )}
              <p className="mt-3 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                Student: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{selectedStudent?.user.name}</span>
                {selectedStudent?.class && ` · Class ${selectedStudent.class}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAreas.map((a) => {
                  const area = AREAS.find((x) => x.key === a);
                  return area ? (
                    <span
                      key={a}
                      className="rounded-pill px-3 py-1 text-[11px] font-medium"
                      style={{ background: area.bg, color: area.color }}
                    >
                      {area.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Severity selector */}
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Urgency Level</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "LOW", label: "Low", color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
                  { key: "MODERATE", label: "Moderate", color: "#FFD93D", bg: "rgba(255,217,61,0.12)" },
                  { key: "HIGH", label: "High", color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
                  { key: "CRITICAL", label: "Critical", color: "#FF6B6B", bg: "rgba(255,107,107,0.12)" },
                ].map((sev) => (
                  <button
                    key={sev.key}
                    onClick={() => setSelectedSeverity(sev.key)}
                    className="rounded-[12px] py-2 text-[11px] font-semibold transition-all"
                    style={{
                      background: selectedSeverity === sev.key ? sev.bg : "var(--bg-card)",
                      color: selectedSeverity === sev.key ? sev.color : "var(--text-muted)",
                      border: `1px solid ${selectedSeverity === sev.key ? sev.color + "50" : "var(--border-card)"}`,
                    }}
                  >
                    {sev.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Would you like to connect this student to counsellor support?
            </p>

            {error && (
              <p className="mt-3 text-center text-[12px]" style={{ color: "#FF6B6B" }}>{error}</p>
            )}

            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="cta-button mt-4 flex w-full items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Yes, Connect
            </button>

            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="mt-3 w-full rounded-[14px] py-3 text-[14px] font-medium transition-all"
              style={{
                background: "transparent",
                border: "1px solid var(--border-card)",
                color: "var(--text-secondary)",
              }}
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
