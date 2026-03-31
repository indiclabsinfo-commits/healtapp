"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateOrgCode } from "@/lib/organizations";
import { useAuthStore } from "@/stores/auth-store";
import { Building2, ArrowRight, Loader2 } from "lucide-react";

export default function OrgCodePage() {
  const router = useRouter();
  const setSelectedOrg = useAuthStore((s) => s.setSelectedOrg);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [org, setOrg] = useState<{ id: number; name: string; type: string; logo?: string } | null>(null);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setOrg(null);

    try {
      const res = await validateOrgCode(code.trim().toUpperCase());
      setOrg(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid organization code");
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!org) return;
    setSelectedOrg({ ...org, code: code.trim().toUpperCase() });
    router.push("/login");
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon */}
      <div
        className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-[22px]"
        style={{ background: "var(--gradient-cta)" }}
      >
        <Building2 size={32} style={{ color: "var(--cta-text)" }} />
      </div>

      <h1
        className="font-heading text-[28px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Enter Your
        <br />
        Organization Code<span style={{ color: "var(--accent-primary)" }}>.</span>
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
        Your school or company provides this code
      </p>

      {/* Code Input */}
      <form onSubmit={handleValidate} className="mt-8 w-full">
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setOrg(null);
              setError("");
            }}
            placeholder="E.g. DPS-DEL-2026"
            className="input-field text-center text-[16px] font-semibold tracking-[2px] uppercase"
            autoFocus
          />
        </div>

        {error && (
          <div
            className="mt-3 rounded-card p-3 text-[12px]"
            style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}
          >
            {error}
          </div>
        )}

        {!org && (
          <button
            type="submit"
            className="cta-button mt-6"
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify Code"
            )}
          </button>
        )}
      </form>

      {/* Org Found */}
      {org && (
        <div className="mt-6 w-full">
          <div
            className="glass-card flex items-center gap-4 p-4"
            style={{ border: "1px solid var(--accent-primary)" }}
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] text-lg"
              style={{ background: "var(--tag-bg)" }}
            >
              {org.type === "SCHOOL" ? "🏫" : "🏢"}
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {org.name}
              </p>
              <p className="text-[11px]" style={{ color: "var(--accent-primary)" }}>
                {org.type === "SCHOOL" ? "School" : "Corporate"} Account
              </p>
            </div>
          </div>

          <button onClick={handleContinue} className="cta-button mt-4">
            <span className="flex items-center justify-center gap-2">
              Continue
              <ArrowRight size={16} />
            </span>
          </button>
        </div>
      )}

      {/* Super Admin link */}
      <p className="mt-8 text-[12px]" style={{ color: "var(--text-muted)" }}>
        MindCare Admin?{" "}
        <Link href="/login" style={{ color: "var(--accent-primary)" }}>
          Sign in directly
        </Link>
      </p>
    </div>
  );
}
