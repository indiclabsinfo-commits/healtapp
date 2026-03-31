"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, _hasHydrated } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 1.5s then redirect
    const timer = setTimeout(() => {
      setShowSplash(false);

      if (isAuthenticated) {
        router.push(isAdmin ? "/admin/dashboard" : "/dashboard");
      } else {
        const onboarded = localStorage.getItem("mindcare-onboarded");
        router.push(onboarded ? "/login" : "/onboarding");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isAdmin, _hasHydrated, router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: "var(--gradient-splash)" }}
    >
      {/* Floating orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: "200px",
          height: "200px",
          background: "var(--accent-primary)",
          opacity: 0.06,
          filter: "blur(60px)",
        }}
      />

      {/* App icon */}
      <div
        className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] text-3xl"
        style={{ background: "var(--gradient-cta)" }}
      >
        🧠
      </div>

      {/* App name */}
      <h1
        className="font-heading text-[32px] font-bold tracking-[2px]"
        style={{ color: "var(--text-primary)" }}
      >
        MindCare
      </h1>
      <p
        className="mt-2 text-[10px] uppercase tracking-[4px]"
        style={{ color: "var(--text-muted)" }}
      >
        your mind matters
      </p>

      {/* Bottom shimmer */}
      <div
        className="absolute bottom-16 h-[3px] w-[40px] rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, var(--accent-primary), transparent)",
          animation: showSplash ? "shimmer 1.5s ease-in-out infinite" : "none",
        }}
      />

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
