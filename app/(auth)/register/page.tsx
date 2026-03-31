"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { registerApi } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await registerApi({ name, email, password });
      login(result.data.user, result.data.accessToken, result.data.refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <h1 className="font-heading text-[28px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
        Create{" "}
        <br />
        Account<span style={{ color: "var(--accent-primary)" }}>.</span>
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
        Start your wellness journey today
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Name */}
        <div>
          <label
            className="mb-2 block text-[10px] font-normal uppercase tracking-[1.5px]"
            style={{ color: "var(--text-muted)" }}
          >
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="input-field"
            required
          />
        </div>

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
              minLength={6}
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

        {/* Confirm Password */}
        <div>
          <label
            className="mb-2 block text-[10px] font-normal uppercase tracking-[1.5px]"
            style={{ color: "var(--text-muted)" }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
            required
            minLength={6}
          />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="cta-button">
          {loading ? "Creating account..." : "Get Started"}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent-primary)" }} className="font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
