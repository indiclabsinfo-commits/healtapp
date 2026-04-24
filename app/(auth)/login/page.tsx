"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Building2, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { loginApi } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const selectedOrg = useAuthStore((s) => s.selectedOrg);
  const setSelectedOrg = useAuthStore((s) => s.setSelectedOrg);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginApi({ email, password });
      const memberships = result.data.organizations || [];
      login(result.data.user, result.data.accessToken, result.data.refreshToken, memberships);

      if (result.data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        // Check member role for routing
        const primaryRole = memberships[0]?.role;
        if (primaryRole === "ORG_ADMIN") {
          router.push("/admin/dashboard");
        } else if (primaryRole === "TEACHER") {
          router.push("/admin/dashboard"); // Teacher uses admin layout
        } else if (primaryRole === "HR") {
          router.push("/admin/dashboard");
        } else if (primaryRole === "COUNSELLOR") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Org Context Banner */}
      {selectedOrg && (
        <div
          className="mb-6 flex items-center gap-3 rounded-[14px] p-3"
          style={{ background: "var(--tag-bg)", border: "1px solid var(--tag-border)" }}
        >
          <span className="text-lg">{selectedOrg.type === "SCHOOL" ? "🏫" : "🏢"}</span>
          <div className="flex-1">
            <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {selectedOrg.name}
            </p>
            <p className="text-[10px]" style={{ color: "var(--accent-primary)" }}>
              Code: {selectedOrg.code}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedOrg(null);
              router.push("/org-code");
            }}
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <h1 className="font-heading text-[28px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
        Welcome{" "}
        <br />
        Back<span style={{ color: "var(--accent-primary)" }}>.</span>
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
        Sign in to continue your journey
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Email */}
        <div>
          <label
            className="mb-2 block text-[10px] font-normal uppercase tracking-[1.5px]"
            style={{ color: "var(--text-muted)" }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@example.com"
            className="input-field"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label
            className="mb-2 block text-[10px] font-normal uppercase tracking-[1.5px]"
            style={{ color: "var(--text-muted)" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-16"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-[12px]"
            style={{ color: "var(--accent-primary)" }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="cta-button">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Register / Org Code links */}
      <div className="mt-8 space-y-3 text-center">
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          New here?{" "}
          <Link href="/register" style={{ color: "var(--accent-primary)" }} className="font-medium">
            Create account
          </Link>
        </p>
        {!selectedOrg && (
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Have an organization code?{" "}
            <Link href="/org-code" style={{ color: "var(--accent-primary)" }} className="font-medium">
              Enter code
            </Link>
          </p>
        )}
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          Are you a school or organisation?{" "}
          <Link href="/org-signup" style={{ color: "var(--accent-primary)" }} className="font-medium">
            Register your institution
          </Link>
        </p>
      </div>
    </div>
  );
}
