"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { getAdminAnalyticsApi, exportAnalyticsApi } from "@/lib/analytics";
import { Users, Activity, UserCheck, TrendingUp, Download } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchAnalytics(); }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const result = await getAdminAnalyticsApi();
      setData(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const blob = await exportAnalyticsApi();
      const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "ambrin-analytics.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { setError("Failed to export"); }
  }

  const kpis = data ? [
    { label: "Total Users", value: data.totalUsers, color: "#6FFFE9", icon: Users },
    { label: "Active Users", value: data.activeUsers, color: "#FF6B6B", icon: Activity },
    { label: "Counsellors", value: data.totalCounsellors, color: "#A78BFA", icon: UserCheck },
    { label: "Completion Rate", value: `${data.completionRate}%`, color: "#4ADE80", icon: TrendingUp },
  ] : [];

  return (
    <div>
      <AdminTopbar title="Analytics" subtitle="Platform insights and metrics" />
      <div className="p-8">
        {error && (
          <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>{error}</div>
        )}

        {loading && <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>Loading analytics...</div>}

        {data && (
          <>
            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="glass-card p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
                    <kpi.icon size={16} style={{ color: kpi.color }} />
                  </div>
                  <p className="mt-2 font-heading text-[28px] font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Category Distribution */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="glass-card p-5">
                <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Assessment Distribution</h3>
                {data.categoryDistribution?.length > 0 ? (
                  <div className="space-y-3">
                    {data.categoryDistribution.map((item: any, i: number) => {
                      const maxCount = Math.max(...data.categoryDistribution.map((d: any) => d.count));
                      const colors = ["#6FFFE9", "#FF6B6B", "#A78BFA", "#FFD93D", "#4ADE80"];
                      return (
                        <div key={i}>
                          <div className="mb-1 flex justify-between">
                            <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{item.category}</span>
                            <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{item.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--input-bg)" }}>
                            <div className="h-full rounded-full" style={{ width: `${(item.count / maxCount) * 100}%`, background: colors[i % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No assessment data yet</p>
                )}
              </div>

              {/* Recent Users */}
              <div className="glass-card p-5">
                <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Recent Users</h3>
                <div className="space-y-3">
                  {data.recentUsers?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "var(--input-bg)" }}>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                      </div>
                      <span className="rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase"
                        style={{
                          background: user.status === "ACTIVE" ? "rgba(111,255,233,0.1)" : "rgba(255,107,107,0.1)",
                          color: user.status === "ACTIVE" ? "var(--accent-primary)" : "#FF6B6B",
                        }}>
                        {user.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export */}
            <button onClick={handleExport} className="flex items-center gap-2 rounded-button border px-6 py-3 text-[13px] font-medium"
              style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", background: "transparent" }}>
              <Download size={14} /> Export CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}
