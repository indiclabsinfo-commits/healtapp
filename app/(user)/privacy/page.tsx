"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Key, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

export default function PrivacyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [showPwForm, setShowPwForm] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirm) {
      setMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPw.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.put("/auth/change-password", { currentPassword: current, newPassword: newPw });
      setMsg({ type: "success", text: "Password changed successfully." });
      setCurrent(""); setNewPw(""); setConfirm("");
      setShowPwForm(false);
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to change password." });
    } finally {
      setSaving(false);
    }
  }

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
            Privacy & Security
          </h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Manage your account security</p>
        </div>
      </div>

      {msg && (
        <div
          className="mb-4 rounded-[12px] p-3 text-[12px]"
          style={{
            background: msg.type === "success" ? "rgba(74,222,128,0.1)" : "rgba(255,107,107,0.1)",
            color: msg.type === "success" ? "#4ADE80" : "#FF6B6B",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Account info */}
      <div className="glass-card mb-4 p-5" style={{ borderRadius: "16px" }}>
        <div className="mb-3 flex items-center gap-2">
          <Shield size={14} style={{ color: "var(--accent-primary)" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Account</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Email</span>
            <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-1" style={{ borderTop: "1px solid var(--border-card)" }}>
            <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Account status</span>
            <span className="tag">Active</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card mb-4 p-5" style={{ borderRadius: "16px" }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={14} style={{ color: "var(--accent-primary)" }} />
            <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Password</p>
          </div>
          {!showPwForm && (
            <button
              onClick={() => setShowPwForm(true)}
              className="text-[12px] font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              Change
            </button>
          )}
        </div>

        {showPwForm ? (
          <form onSubmit={handleChangePw} className="space-y-3">
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Current password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="input-field pr-10 text-[13px]"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="New password (min 8 characters)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                className="input-field pr-10 text-[13px]"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="input-field text-[13px]"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="cta-button flex-1 disabled:opacity-50" style={{ padding: "12px" }}>
                {saving ? "Saving…" : "Update Password"}
              </button>
              <button type="button" onClick={() => { setShowPwForm(false); setMsg(null); }}
                className="rounded-[12px] px-4 text-[13px]"
                style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Use a strong password with at least 8 characters.
          </p>
        )}
      </div>

      {/* Data privacy */}
      <div className="glass-card p-5" style={{ borderRadius: "16px" }}>
        <div className="mb-3 flex items-center gap-2">
          <Lock size={14} style={{ color: "var(--accent-primary)" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Data & Privacy</p>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Your assessment data is confidential and only shared with your assigned counsellor and organisation administrator as per your consent.
          We do not sell or share your personal data with third parties.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-[10px] p-3" style={{ background: "rgba(111,255,233,0.06)" }}>
          <AlertTriangle size={12} style={{ color: "var(--accent-primary)", marginTop: 1, flexShrink: 0 }} />
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Contact your organisation admin or Snowflakes Counselling support to request data deletion.
          </p>
        </div>
      </div>
    </div>
  );
}
