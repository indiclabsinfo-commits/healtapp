import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  gender?: string;
  age?: number;
  role: "USER" | "ADMIN";
  status: string;
  createdAt: string;
}

interface OrgMembership {
  id: number;
  role: string; // STUDENT, EMPLOYEE, TEACHER, HR, ORG_ADMIN
  class?: string | null;
  department?: string | null;
  creditBalance: number;
  organization: {
    id: number;
    name: string;
    type: string; // SCHOOL, CORPORATE
    logo?: string | null;
  };
}

interface SelectedOrg {
  id: number;
  name: string;
  type: string;
  logo?: string | null;
  code?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  memberships: OrgMembership[];
  memberRole: string | null; // active org role
  selectedOrg: SelectedOrg | null; // org selected at login
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string, memberships?: OrgMembership[]) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setSelectedOrg: (org: SelectedOrg | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      memberships: [],
      memberRole: null,
      selectedOrg: null,
      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
      login: (user, accessToken, refreshToken, memberships = []) => {
        const primaryMembership = memberships[0] || null;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAdmin: user.role === "ADMIN",
          memberships,
          memberRole: primaryMembership?.role || null,
        });
      },
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
          memberships: [],
          memberRole: null,
          selectedOrg: null,
        }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setUser: (user) =>
        set({ user, isAdmin: user.role === "ADMIN" }),
      setSelectedOrg: (org) => set({ selectedOrg: org }),
    }),
    {
      name: "mindcare-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
