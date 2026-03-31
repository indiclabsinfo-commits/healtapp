"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import { getAdminAnalyticsApi } from "@/lib/analytics";
import { Users, Activity, UserCheck, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await getAdminAnalyticsApi();
      setData(res.data);
    } catch {
      // silent fail — show zeros
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    { label: "Total Users", value: data?.totalUsers ?? 0, color: "#6FFFE9", icon: Users },
    { label: "Active Users", value: data?.activeUsers ?? 0, color: "#FF6B6B", icon: Activity },
    { label: "Counsellors", value: data?.totalCounsellors ?? 0, color: "#A78BFA", icon: UserCheck },
    { label: "Completion Rate", value: `${data?.completionRate ?? 0}%`, color: "#4ADE80", icon: TrendingUp },
  ];

  return (
    <div>
      <AdminTopbar title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(" ")[0] || "Admin"}`} />

      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  {kpi.label}
                </p>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
              <p className="mt-2 font-heading text-[28px] font-bold" style={{ color: kpi.color }}>
                {loading ? "—" : kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Users + Category Distribution */}
        {data && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Users */}
            <div className="glass-card p-5">
              <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Users
              </h3>
              <div className="space-y-3">
                {data.recentUsers?.map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-[10px] p-3"
                    style={{ background: "var(--input-bg)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[11px] font-bold"
                        style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}
                      >
                        {u.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{u.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                      </div>
                    </div>
                    <span
                      className="rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase"
                      style={{
                        background: u.status === "ACTIVE" ? "rgba(111,255,233,0.1)" : "rgba(255,107,107,0.1)",
                        color: u.status === "ACTIVE" ? "var(--accent-primary)" : "#FF6B6B",
                      }}
                    >
                      {u.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Distribution */}
            <div className="glass-card p-5">
              <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Assessment Distribution
              </h3>
              {data.categoryDistribution?.length > 0 ? (
                <div className="space-y-3">
                  {data.categoryDistribution.map((item: any, i: number) => {
                    const maxCount = Math.max(...data.categoryDistribution.map((d: any) => d.count));
                    const colors = ["#6FFFE9", "#FF6B6B", "#A78BFA", "#FFD93D"];
                    return (
                      <div key={i}>
                        <div className="mb-1 flex justify-between">
                          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{item.category}</span>
                          <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--input-bg)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(item.count / maxCount) * 100}%`, background: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No assessments taken yet</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
