"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
        const onboarded = localStorage.getItem("ambrin-onboarded");
        router.push(onboarded ? "/login" : "/onboarding");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isAdmin, _hasHydrated, router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: "#FFFFFF" }}
    >
      {/* Logo image (contains brain + ambrin text + by Snowflakes Counselling) */}
      <Image
        src="/ambrin-logo.jpeg"
        alt="ambrin by Snowflakes Counselling"
        width={280}
        height={420}
        priority
        style={{ objectFit: "contain" }}
      />

      {/* Bottom shimmer */}
      <div
        className="absolute bottom-16 h-[3px] w-[40px] rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, #6FFFE9, transparent)",
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
