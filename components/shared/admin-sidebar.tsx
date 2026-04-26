"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  BookOpen,
  Upload,
  BarChart3,
  Wind,
  Menu,
  X,
  LogOut,
  Building2,
  CreditCard,
  FileText,
  AlertTriangle,
  Calendar,
  Bell,
  DollarSign,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

type NavItem = { href: string; label: string; icon: any };

// Super Admin sees everything
const superAdminNav: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/counsellors", label: "Counsellors", icon: UserCheck },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/questionnaire", label: "Questionnaire", icon: ClipboardList },
  { href: "/admin/theory", label: "Theory", icon: BookOpen },
  { href: "/admin/breathing", label: "Breathing", icon: Wind },
  { href: "/admin/bulk-register", label: "Bulk Register", icon: Upload },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/payouts", label: "Payouts", icon: DollarSign },
];

// Org Admin sees org-scoped items
const orgAdminNav: NavItem[] = [
  { href: "/admin/users", label: "Members", icon: Users },
  { href: "/admin/counsellors", label: "Counsellors", icon: UserCheck },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/assignments", label: "Assignments", icon: FileText },
  { href: "/admin/behavior-log", label: "Behavior Log", icon: AlertTriangle },
  { href: "/admin/principal", label: "Analytics", icon: BarChart3 },
  { href: "/admin/bulk-register", label: "Bulk Register", icon: Upload },
  { href: "/admin/consent", label: "Parent Consent", icon: ShieldCheck },
  { href: "/admin/schedule", label: "Schedules", icon: Calendar },
  { href: "/admin/credits", label: "Credits", icon: CreditCard },
  { href: "/admin/payouts", label: "Payouts", icon: DollarSign },
  { href: "/admin/org-settings", label: "Organization", icon: Settings },
];

// Teacher sees student-focused items
const teacherNav: NavItem[] = [
  { href: "/admin/students", label: "My Students", icon: Users },
  { href: "/admin/notice-change", label: "Notice a Change", icon: Bell },
  { href: "/admin/behavior-log", label: "Behavior Log", icon: AlertTriangle },
  { href: "/admin/assignments", label: "Assignments", icon: FileText },
  { href: "/admin/analytics", label: "Class Wellness", icon: BarChart3 },
];

// HR sees employee-focused items
const hrNav: NavItem[] = [
  { href: "/admin/users", label: "Employees", icon: Users },
  { href: "/admin/analytics", label: "Wellness Reports", icon: BarChart3 },
];

// Counsellor sees schedule-focused items
const counsellorNav: NavItem[] = [
  { href: "/admin/counsellor-dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/admin/schedule", label: "My Schedule", icon: Calendar },
  { href: "/admin/clients", label: "My Clients", icon: Users },
  { href: "/admin/flagged", label: "Flagged Students", icon: AlertTriangle },
];

function getNavForRole(isAdmin: boolean, memberRole: string | null): { nav: NavItem[]; roleLabel: string } {
  if (isAdmin) return { nav: superAdminNav, roleLabel: "Super Admin" };

  switch (memberRole) {
    case "ORG_ADMIN": return { nav: orgAdminNav, roleLabel: "Organization Admin" };
    case "TEACHER": return { nav: teacherNav, roleLabel: "Teacher" };
    case "HR": return { nav: hrNav, roleLabel: "HR Manager" };
    default: return { nav: counsellorNav, roleLabel: "Counsellor" };
  }
}

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const memberRole = useAuthStore((s) => s.memberRole);
  const memberships = useAuthStore((s) => s.memberships);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { nav: managementNav, roleLabel } = getNavForRole(isAdmin, memberRole);
  const orgName = memberships[0]?.organization?.name;

  function NavLink({ href, label, icon: Icon }: NavItem) {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] transition-all"
        style={{
          background: isActive ? "var(--pill-active-bg)" : "transparent",
          color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
          fontWeight: isActive ? 600 : 400,
        }}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-[10px] lg:hidden"
        style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-card)" }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "240px", background: "var(--bg-primary)", borderColor: "var(--border-card)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="font-heading text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              ambrin
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden" style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Org badge (if in an org) */}
        {orgName && (
          <div className="mx-3 mb-4 rounded-[10px] px-3 py-2" style={{ background: "var(--tag-bg)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{roleLabel}</p>
            <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>at {orgName}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3">
          <p className="mb-2 px-3 text-[9px] font-normal uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
            Main
          </p>
          <NavLink href="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} />

          <p className="mb-2 mt-6 px-3 text-[9px] font-normal uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
            Management
          </p>
          {managementNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        {/* Profile + logout */}
        <div className="border-t px-5 py-4" style={{ borderColor: "var(--border-card)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-sm font-bold"
              style={{ background: "var(--gradient-cta)", color: "var(--cta-text)" }}
            >
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                {user?.name || "Admin"}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {isAdmin ? "Super Admin" : roleLabel}
              </p>
            </div>
            <button
              onClick={() => { logout(); window.location.href = "/login"; }}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(255,107,107,0.1)]"
              style={{ color: "var(--text-muted)" }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
