"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import { getOrganizationApi, updateOrganizationApi } from "@/lib/organizations";
import { Code2, CreditCard, Users, Mail, Phone, MapPin, Calendar, Pencil, X, Check, Loader2 } from "lucide-react";

function InfoRow({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon?: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
      {Icon && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px]" style={{ background: "var(--tag-bg)" }}>
          <Icon size={14} style={{ color: "var(--accent-primary)" }} />
        </div>
      )}
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="mt-0.5 text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

export default function OrgSettingsPage() {
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships?.[0]?.organization?.id;
  const orgName = memberships?.[0]?.organization?.name || "Organization";

  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  useEffect(() => {
    if (!orgId) return;
    getOrganizationApi(orgId)
      .then((res) => {
        const data = res.data || res;
        setOrg(data);
        setForm({
          name: data.name || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          address: data.address || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await updateOrganizationApi(orgId, {
        name: form.name,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        address: form.address || undefined,
      });
      const updated = res.data || res;
      setOrg((prev: any) => ({ ...prev, ...updated }));
      setSaveMsg({ type: "success", text: "Organization updated successfully." });
      setEditing(false);
    } catch (err: any) {
      setSaveMsg({ type: "error", text: err.response?.data?.error || "Failed to update organization." });
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setSaveMsg(null);
    setForm({
      name: org?.name || "",
      contactEmail: org?.contactEmail || "",
      contactPhone: org?.contactPhone || "",
      address: org?.address || "",
    });
  }

  const memberCount = org?._count?.members ?? org?.memberCount;
  const creditBalance = org?.creditBalance;
  const createdAt = org?.createdAt
    ? new Date(org.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div>
      <AdminTopbar title="Organization" subtitle={`Settings for ${org?.name || orgName}`} />

      <div className="p-8">
        {loading ? (
          <div className="py-12 text-center">
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">

            {saveMsg && (
              <div
                className="rounded-[12px] p-3 text-[12px]"
                style={{
                  background: saveMsg.type === "success" ? "rgba(74,222,128,0.1)" : "rgba(255,107,107,0.1)",
                  color: saveMsg.type === "success" ? "#4ADE80" : "#FF6B6B",
                }}
              >
                {saveMsg.text}
              </div>
            )}

            {/* Identity card */}
            <div className="glass-card p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[14px] text-2xl"
                    style={{ background: "var(--tag-bg)" }}>
                    {org?.type === "SCHOOL" ? "🏫" : "🏢"}
                  </div>
                  <div>
                    <h2 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {org?.name || orgName}
                    </h2>
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                      {org?.type === "SCHOOL" ? "School" : org?.type === "CORPORATE" ? "Corporate" : org?.type || "Organization"}
                    </p>
                  </div>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-medium transition-all"
                    style={{ background: "var(--tag-bg)", color: "var(--accent-primary)", border: "1px solid var(--tag-border)" }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      minLength={2}
                      className="input-field text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      className="input-field text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      className="input-field text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                      Address
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={2}
                      className="input-field text-[13px]"
                      style={{ resize: "none" }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50"
                      style={{ background: "var(--gradient-cta)", color: "#0B0C10" }}
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-[13px]"
                      style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}
                    >
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <InfoRow label="Organization Code" value={org?.code} icon={Code2} />
                  <InfoRow label="Contact Email" value={org?.contactEmail} icon={Mail} />
                  <InfoRow label="Contact Phone" value={org?.contactPhone} icon={Phone} />
                  <InfoRow label="Address" value={org?.address || null} icon={MapPin} />
                  <InfoRow label="Registered On" value={createdAt} icon={Calendar} />
                </>
              )}
            </div>

            {/* Credits + Members */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="glass-card p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "rgba(111,255,233,0.1)" }}>
                    <CreditCard size={16} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>Credit Balance</p>
                </div>
                <p className="font-heading text-[32px] font-bold" style={{ color: "var(--accent-primary)" }}>
                  {creditBalance ?? "—"}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>counselling credits available</p>
              </div>

              <div className="glass-card p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "rgba(167,139,250,0.1)" }}>
                    <Users size={16} style={{ color: "#A78BFA" }} />
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>Total Members</p>
                </div>
                <p className="font-heading text-[32px] font-bold" style={{ color: "#A78BFA" }}>
                  {memberCount ?? "—"}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>registered in your organization</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
