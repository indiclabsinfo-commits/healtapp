"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordApi } from "@/lib/auth";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password. Token may be expired.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px]"
          style={{ background: "var(--tag-bg)" }}
        >
          <CheckCircle2 size={32} style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1 className="font-heading text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Password Reset
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          Your password has been successfully reset.
        </p>
        <Link href="/login" className="cta-button mt-8 text-center">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-[28px] font-semibold" style={{ color: "var(--text-primary)" }}>
        New Password
      </h1>
      <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
        Enter your new password below
      </p>

      {error && (
        <div className="mt-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-12"
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

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
            required
          />
        </div>

        <button type="submit" className="cta-button mt-6" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>
        Remember your password?{" "}
        <Link href="/login" style={{ color: "var(--accent-primary)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
