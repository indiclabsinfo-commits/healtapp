"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { CreditCard, Users, TrendingUp, Plus, X, Coins, User } from "lucide-react";

interface OrgMember {
  id: number;
  role: string;
  class?: string | null;
  department?: string | null;
  creditBalance: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface OrgInfo {
  id: number;
  name: string;
  creditBalance: number;
  _count?: { members: number };
}

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  STUDENT: { bg: "rgba(111,255,233,0.1)", color: "#6FFFE9", border: "rgba(111,255,233,0.15)" },
  TEACHER: { bg: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "rgba(167,139,250,0.15)" },
  COUNSELLOR: { bg: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "rgba(96,165,250,0.15)" },
  ORG_ADMIN: { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)" },
  EMPLOYEE: { bg: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "rgba(74,222,128,0.15)" },
  HR: { bg: "rgba(251,146,60,0.1)", color: "#FB923C", border: "rgba(251,146,60,0.15)" },
};

export default function AdminCreditsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const memberships = useAuthStore((s) => s.memberships);

  // Super admins pick an org from the dropdown; org members default to their first org.
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(memberships?.[0]?.organization?.id ?? null);
  const [allOrgs, setAllOrgs] = useState<{ id: number; name: string; creditBalance: number }[]>([]);
  const orgId = selectedOrgId;

  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Org-level add credits modal
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState("100");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Per-member credit allocation
  const [memberCreditTarget, setMemberCreditTarget] = useState<OrgMember | null>(null);
  const [memberCreditAmount, setMemberCreditAmount] = useState("10");
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberFormError, setMemberFormError] = useState("");

  useEffect(() => {
    if (orgId) {
      fetchData();
    } else if (isAdmin) {
      // Super admin with no membership — fetch all orgs for picker
      setLoading(false);
      api.get("/organizations").then((res) => {
        const orgs = res.data?.data || [];
        setAllOrgs(orgs);
        if (orgs.length > 0 && selectedOrgId == null) setSelectedOrgId(orgs[0].id);
      }).catch(() => {});
    }
  }, [orgId, isAdmin]);

  // Fetch org list once for super admin (drives the picker dropdown)
  useEffect(() => {
    if (isAdmin) {
      api.get("/organizations").then((res) => {
        setAllOrgs(res.data?.data || []);
      }).catch(() => {});
    }
  }, [isAdmin]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [orgRes, membersRes] = await Promise.all([
        api.get(`/organizations/${orgId}`),
        api.get(`/organizations/${orgId}/members`, { params: { limit: 100 } }),
      ]);
      setOrgInfo(orgRes.data.data);
      setMembers(membersRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch credit data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAllocateCredits(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const amount = parseInt(creditAmount);
      if (isNaN(amount) || amount <= 0) {
        setFormError("Please enter a valid positive amount");
        setSaving(false);
        return;
      }

      await api.post(`/organizations/${orgId}/credits`, { amount });
      setShowAddCredits(false);
      setCreditAmount("100");
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to allocate credits");
    } finally {
      setSaving(false);
    }
  }

  async function handleAllocateMemberCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!memberCreditTarget) return;
    setMemberSaving(true);
    setMemberFormError("");
    try {
      const amount = parseInt(memberCreditAmount);
      if (isNaN(amount) || amount <= 0) { setMemberFormError("Enter valid positive amount"); setMemberSaving(false); return; }
      await api.patch(`/organizations/${orgId}/members/${memberCreditTarget.id}/credits`, { amount });
      setMemberCreditTarget(null);
      setMemberCreditAmount("10");
      fetchData();
    } catch (err: any) {
      setMemberFormError(err.response?.data?.error || "Failed to allocate credits");
    } finally {
      setMemberSaving(false);
    }
  }

  function getRoleStyle(role: string) {
    return ROLE_COLORS[role] || ROLE_COLORS.STUDENT;
  }

  const totalUsed = members.reduce((sum, m) => sum + m.creditBalance, 0);
  const orgCredits = orgInfo?.creditBalance ?? 0;

  if (!orgId) {
    return (
      <div>
        <AdminTopbar title="Credit Management" subtitle="Manage organization credits" />
        <div className="p-8">
          {isAdmin ? (
            <div className="glass-card p-8 text-center" style={{ borderRadius: "20px", maxWidth: 480, margin: "0 auto" }}>
              <p className="text-[14px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Choose an organization</p>
              <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
                As Super Admin, you can manage credits for any organization. Select one below.
              </p>
              {allOrgs.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Loading organizations…</p>
              ) : (
                <select
                  className="input-field"
                  onChange={(e) => setSelectedOrgId(e.target.value ? parseInt(e.target.value) : null)}
                  defaultValue=""
                >
                  <option value="" disabled>Select an organization…</option>
                  {allOrgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.creditBalance} credits)</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              No organization membership found. You need to be part of an organization to manage credits.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminTopbar title="Credit Management" subtitle="Manage organization credits and member balances" />

      <div className="p-8">
        {/* Super admin org picker */}
        {isAdmin && allOrgs.length > 0 && (
          <div className="mb-5 flex items-center gap-3">
            <label htmlFor="org-picker" className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              Org
            </label>
            <select
              id="org-picker"
              className="input-field"
              style={{ maxWidth: 320 }}
              value={selectedOrgId ?? ""}
              onChange={(e) => setSelectedOrgId(e.target.value ? parseInt(e.target.value) : null)}
            >
              {allOrgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Loading credit data...
          </div>
        )}

        {!loading && (
          <>
            {/* Credit Overview KPIs */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{ background: "rgba(111,255,233,0.1)", color: "#6FFFE9" }}
                  >
                    <Coins size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Total Credits</p>
                    <p className="font-heading text-[24px] font-bold" style={{ color: "var(--accent-primary)" }}>{orgCredits}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}
                  >
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Allocated to Members</p>
                    <p className="font-heading text-[24px] font-bold" style={{ color: "#FF6B6B" }}>{totalUsed}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80" }}
                  >
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Remaining</p>
                    <p className="font-heading text-[24px] font-bold" style={{ color: "#4ADE80" }}>{orgCredits - totalUsed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Header + Add Credits button (super admin only) */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Members
                </h2>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {members.length} member{members.length !== 1 ? "s" : ""} in {orgInfo?.name || "organization"}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setFormError(""); setShowAddCredits(true); }}
                  className="cta-button flex items-center gap-2"
                  style={{ width: "auto", padding: "10px 20px" }}
                >
                  <Plus size={16} />
                  Add Credits
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="space-y-3">
              {members.map((member) => {
                const roleStyle = getRoleStyle(member.role);
                return (
                  <div key={member.id} className="glass-card flex items-center gap-4 p-4" style={{ borderRadius: "16px" }}>
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: roleStyle.bg, color: roleStyle.color }}
                    >
                      <User size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {member.user.name}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {member.user.email}
                        {member.class ? ` \u00B7 Class ${member.class}` : ""}
                        {member.department ? ` \u00B7 ${member.department}` : ""}
                      </p>
                    </div>
                    <span
                      className="tag"
                      style={{ background: roleStyle.bg, color: roleStyle.color, borderColor: roleStyle.border }}
                    >
                      {member.role}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[14px] font-bold" style={{ color: "var(--accent-primary)" }}>
                          {member.creditBalance}
                        </p>
                        <p className="text-[9px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>credits</p>
                      </div>
                      <button
                        onClick={() => { setMemberFormError(""); setMemberCreditTarget(member); setMemberCreditAmount("10"); }}
                        className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-opacity hover:opacity-70"
                        style={{ background: "rgba(111,255,233,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(111,255,233,0.15)" }}
                        title="Allocate credits to this member"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty */}
            {members.length === 0 && (
              <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                No members found in this organization
              </div>
            )}
          </>
        )}
      </div>

      {/* Per-Member Credit Modal */}
      {memberCreditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="glass-card mx-4 w-full max-w-md p-6" style={{ borderRadius: "20px" }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Allocate to Member
              </h2>
              <button onClick={() => setMemberCreditTarget(null)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            {memberFormError && (
              <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>{memberFormError}</div>
            )}
            <form onSubmit={handleAllocateMemberCredits} className="space-y-4">
              <div className="input-field" style={{ opacity: 0.7 }}>{memberCreditTarget.user.name}</div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Credits to Allocate</label>
                <input
                  type="number"
                  value={memberCreditAmount}
                  onChange={(e) => setMemberCreditAmount(e.target.value)}
                  className="input-field"
                  min={1}
                  max={orgCredits}
                  required
                />
              </div>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Org balance: <strong>{orgCredits}</strong> → after: <strong>{orgCredits - (parseInt(memberCreditAmount) || 0)}</strong>
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMemberCreditTarget(null)} className="flex-1 rounded-button border px-4 py-3 text-[13px] font-medium" style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", background: "transparent" }}>Cancel</button>
                <button type="submit" disabled={memberSaving} className="cta-button flex-1">{memberSaving ? "Allocating..." : "Allocate"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="glass-card mx-4 w-full max-w-md p-6"
            style={{ borderRadius: "20px" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Allocate Credits
              </h2>
              <button onClick={() => setShowAddCredits(false)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAllocateCredits} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Organization
                </label>
                <div className="input-field" style={{ opacity: 0.7 }}>
                  {orgInfo?.name || "Organization"}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Credit Amount
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="input-field"
                  min={1}
                  placeholder="100"
                  required
                />
              </div>

              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Current balance: <strong>{orgCredits}</strong> credits. After allocation:{" "}
                <strong>{orgCredits + (parseInt(creditAmount) || 0)}</strong> credits.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCredits(false)}
                  className="flex-1 rounded-button border px-4 py-3 text-[13px] font-medium"
                  style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", background: "transparent" }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="cta-button flex-1">
                  {saving ? "Allocating..." : "Allocate Credits"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
