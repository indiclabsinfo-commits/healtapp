"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { BottomNav } from "@/components/shared/bottom-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
    } else if (isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, isAdmin, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      {/* Top bar with theme toggle */}
      <header
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-end px-5 py-3"
        style={{
          background: "var(--bg-body)",
          borderBottom: "1px solid var(--border-card)",
        }}
      >
        <ThemeToggle size="sm" />
      </header>
      <main className="px-5 pb-24 pt-[64px] md:px-10">{children}</main>
      <BottomNav />
    </div>
  );
}
