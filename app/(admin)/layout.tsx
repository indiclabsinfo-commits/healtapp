"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AdminSidebar } from "@/components/shared/admin-sidebar";

const ADMIN_ROLES = ["ORG_ADMIN", "TEACHER", "HR", "COUNSELLOR"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, memberRole, _hasHydrated } = useAuthStore();

  const hasAdminAccess = isAdmin || (memberRole && ADMIN_ROLES.includes(memberRole));

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!hasAdminAccess) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, hasAdminAccess, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated || !hasAdminAccess) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <AdminSidebar />
      <div className="ml-0 lg:ml-[240px]">{children}</div>
    </div>
  );
}
