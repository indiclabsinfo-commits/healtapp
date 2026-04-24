"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { listCounsellorsApi } from "@/lib/counsellors";
import { getCounsellorConsultationsApi } from "@/lib/consultations";
import {
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Loader2,
  X,
  Calendar,
  Clock,
  ArrowLeft,
} from "lucide-react";

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  hourlyRate: number | null;
  photo: string | null;
}

interface Consultation {
  id: number;
  userId: number;
  user: { id: number; name: string; email: string };
  counsellorId: number;
  date: string;
  time: string;
  duration: number;
  status: string;
  creditUsed: number;
}

interface CounsellorData {
  counsellor: Counsellor;
  consultations: Consultation[];
}

const PLATFORM_CUT_PCT = 0.30;

function calcFee(c: Consultation, hourlyRate: number): number {
  return Math.round(hourlyRate * (c.duration / 60));
}

function calcPlatformCut(fee: number): number {
  return Math.round(fee * PLATFORM_CUT_PCT);
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PayoutsPage() {
  const [counsellorData, setCounsellorData] = useState<CounsellorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCounsellorId, setSelectedCounsellorId] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<CounsellorData | null>(null);
  const [releasedIds, setReleasedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await listCounsellorsApi({ limit: 100 });
      const counsellors: Counsellor[] = res.data || [];

      const dataPromises = counsellors.map(async (c) => {
        try {
          const conRes = await getCounsellorConsultationsApi(c.id, { limit: 200 });
          return { counsellor: c, consultations: conRes.data || [] };
        } catch {
          return { counsellor: c, consultations: [] };
        }
      });

      setCounsellorData(await Promise.all(dataPromises));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function filterByMonth(consultations: Consultation[]): Consultation[] {
    return consultations.filter((c) => {
      const d = new Date(c.date);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return month === selectedMonth;
    });
  }

  const allFilteredConsultations = counsellorData.flatMap(({ counsellor, consultations }) => {
    const filtered = filterByMonth(consultations);
    return filtered.map((c) => ({ ...c, counsellor }));
  });

  const totalSessions = allFilteredConsultations.length;
  const totalRevenue = allFilteredConsultations.reduce((sum, c) => {
    const rate = (c as any).counsellor.hourlyRate || 1000;
    return sum + calcFee(c, rate);
  }, 0);
  const totalPlatform = Math.round(totalRevenue * PLATFORM_CUT_PCT);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  return (
    <div>
      <AdminTopbar title="Payout Dashboard" subtitle="Track therapist earnings and manage payouts" />

      <div className="p-4 lg:p-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : detailView ? (
          <TherapistDetail
            data={detailView}
            selectedMonth={selectedMonth}
            filterByMonth={filterByMonth}
            released={releasedIds.has(detailView.counsellor.id)}
            onRelease={() => setReleasedIds((prev) => new Set([...prev, detailView.counsellor.id]))}
            onBack={() => setDetailView(null)}
          />
        ) : (
          <>
            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                icon={<Users size={18} />}
                label="Total Sessions"
                value={String(totalSessions)}
                color="#6FFFE9"
                colorBg="rgba(111,255,233,0.1)"
              />
              <KpiCard
                icon={<DollarSign size={18} />}
                label="Total Revenue"
                value={formatINR(totalRevenue)}
                color="#A78BFA"
                colorBg="rgba(167,139,250,0.1)"
              />
              <KpiCard
                icon={<TrendingUp size={18} />}
                label="Platform Earnings"
                value={formatINR(totalPlatform)}
                color="#4ADE80"
                colorBg="rgba(74,222,128,0.1)"
              />
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-field text-[13px]"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Therapist</label>
                <select
                  value={selectedCounsellorId ?? ""}
                  onChange={(e) => setSelectedCounsellorId(e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field text-[13px]"
                >
                  <option value="">All Therapists</option>
                  {counsellorData.map(({ counsellor }) => (
                    <option key={counsellor.id} value={counsellor.id}>{counsellor.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Therapist Payout Cards */}
            <div className="mb-8 space-y-3">
              {counsellorData
                .filter((d) => !selectedCounsellorId || d.counsellor.id === selectedCounsellorId)
                .map(({ counsellor, consultations }) => {
                  const filtered = filterByMonth(consultations);
                  const rate = counsellor.hourlyRate || 1000;
                  const totalCollected = filtered.reduce((s, c) => s + calcFee(c, rate), 0);
                  const platformEarnings = Math.round(totalCollected * PLATFORM_CUT_PCT);
                  const payoutDue = totalCollected - platformEarnings;
                  const released = releasedIds.has(counsellor.id);

                  return (
                    <div
                      key={counsellor.id}
                      className="glass-card p-5"
                      style={{ borderRadius: "20px" }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] text-[15px] font-bold"
                            style={{ background: "var(--gradient-cta)", color: "var(--cta-text)" }}
                          >
                            {counsellor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                              {counsellor.name}
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {counsellor.specialization}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Sessions</p>
                            <p className="font-heading text-[18px] font-bold" style={{ color: "var(--accent-primary)" }}>
                              {filtered.length}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Collected</p>
                            <p className="font-heading text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                              {formatINR(totalCollected)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Payout Due</p>
                            <p className="font-heading text-[18px] font-bold" style={{ color: "#4ADE80" }}>
                              {formatINR(payoutDue)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-pill px-3 py-1 text-[10px] font-medium"
                            style={{ background: "rgba(111,255,233,0.1)", color: "#6FFFE9", border: "1px solid rgba(111,255,233,0.15)" }}
                          >
                            Monthly
                          </span>
                          <button
                            onClick={() => setDetailView({ counsellor, consultations })}
                            className="flex items-center gap-1 rounded-[12px] px-3 py-2 text-[11px] font-medium"
                            style={{
                              background: "var(--tag-bg)",
                              color: "var(--accent-primary)",
                              border: "1px solid var(--tag-border)",
                            }}
                          >
                            View <ChevronRight size={12} />
                          </button>
                          <button
                            onClick={() => setReleasedIds((prev) => new Set([...prev, counsellor.id]))}
                            disabled={released || filtered.length === 0}
                            className="rounded-[12px] px-4 py-2 text-[12px] font-semibold transition-all"
                            style={{
                              background: released ? "rgba(74,222,128,0.1)" : "var(--gradient-cta)",
                              color: released ? "#4ADE80" : "var(--cta-text)",
                              opacity: filtered.length === 0 ? 0.4 : 1,
                            }}
                          >
                            {released ? "Released ✓" : "Release Payout"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Recent Sessions Table */}
            <div className="glass-card" style={{ borderRadius: "20px", overflow: "hidden" }}>
              <div className="border-b px-5 py-4" style={{ borderColor: "var(--border-card)" }}>
                <h3 className="font-heading text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Recent Sessions
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                      {["Date", "Therapist", "Client", "Session Fee", "Platform Cut", "Status"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[1.5px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFilteredConsultations.slice(0, 10).map((c) => {
                      const rate = (c as any).counsellor.hourlyRate || 1000;
                      const fee = calcFee(c, rate);
                      const cut = calcPlatformCut(fee);
                      return (
                        <tr
                          key={c.id}
                          className="border-b transition-colors"
                          style={{ borderColor: "var(--border-card)" }}
                        >
                          <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                            {formatDate(c.date)}
                          </td>
                          <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                            {(c as any).counsellor.name}
                          </td>
                          <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                            {c.user.name}
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                            {formatINR(fee)}
                          </td>
                          <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                            {formatINR(cut)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                              style={{
                                background: c.status === "COMPLETED" ? "rgba(74,222,128,0.1)" : "rgba(111,255,233,0.1)",
                                color: c.status === "COMPLETED" ? "#4ADE80" : "#6FFFE9",
                              }}
                            >
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {allFilteredConsultations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                          No sessions found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, colorBg }: { icon: React.ReactNode; label: string; value: string; color: string; colorBg: string }) {
  return (
    <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[12px]"
          style={{ background: colorBg, color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
          <p className="font-heading text-[22px] font-bold" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function TherapistDetail({
  data,
  selectedMonth,
  filterByMonth,
  released,
  onRelease,
  onBack,
}: {
  data: CounsellorData;
  selectedMonth: string;
  filterByMonth: (c: Consultation[]) => Consultation[];
  released: boolean;
  onRelease: () => void;
  onBack: () => void;
}) {
  const { counsellor, consultations } = data;
  const filtered = filterByMonth(consultations);
  const rate = counsellor.hourlyRate || 1000;
  const totalCollected = filtered.reduce((s, c) => s + calcFee(c, rate), 0);
  const totalPlatform = Math.round(totalCollected * PLATFORM_CUT_PCT);
  const totalPayout = totalCollected - totalPlatform;

  return (
    <div>
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="glass-card p-5 mb-5" style={{ borderRadius: "20px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px] text-[18px] font-bold"
              style={{ background: "var(--gradient-cta)", color: "var(--cta-text)" }}
            >
              {counsellor.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {counsellor.name}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {new Date(selectedMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Sessions</p>
              <p className="font-heading text-[20px] font-bold" style={{ color: "var(--accent-primary)" }}>{filtered.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Total Earnings</p>
              <p className="font-heading text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>{formatINR(totalCollected)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Payout Due</p>
              <p className="font-heading text-[20px] font-bold" style={{ color: "#4ADE80" }}>{formatINR(totalPayout)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Breakdown */}
      <div className="glass-card mb-5" style={{ borderRadius: "20px", overflow: "hidden" }}>
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--border-card)" }}>
          <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Session Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                {["Date & Time", "Client", "Fee", "Platform Cut", "You Earned", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[1.5px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const fee = calcFee(c, rate);
                const cut = calcPlatformCut(fee);
                const earned = fee - cut;
                return (
                  <tr key={c.id} className="border-b" style={{ borderColor: "var(--border-card)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      <div>{formatDate(c.date)}</div>
                      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{c.time}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{c.user.name}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{formatINR(fee)}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{formatINR(cut)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#4ADE80" }}>{formatINR(earned)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                        style={{
                          background: c.status === "COMPLETED" ? "rgba(74,222,128,0.1)" : "rgba(111,255,233,0.1)",
                          color: c.status === "COMPLETED" ? "#4ADE80" : "#6FFFE9",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                    No sessions in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div
            className="flex items-center justify-between border-t px-5 py-4 text-[13px] font-semibold"
            style={{ borderColor: "var(--border-card)", color: "var(--text-primary)" }}
          >
            <span>{filtered.length} Sessions · Total Collected {formatINR(totalCollected)}</span>
            <span>Total You {formatINR(totalPayout)}</span>
          </div>
        )}
      </div>

      {/* Confirm Payout Button */}
      <button
        onClick={onRelease}
        disabled={released || filtered.length === 0}
        className="cta-button flex w-full max-w-md items-center justify-center gap-2"
        style={{ opacity: filtered.length === 0 ? 0.4 : 1 }}
      >
        {released ? (
          <><CheckCircle size={16} /> Payout Released — {formatINR(totalPayout)}</>
        ) : (
          <>Confirm Payout for {formatINR(totalPayout)}</>
        )}
      </button>
    </div>
  );
}
