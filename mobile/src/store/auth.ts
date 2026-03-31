import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../config/api';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  gender?: string;
  age?: number;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface OrgMembership {
  id: number;
  role: string;
  class?: string | null;
  department?: string | null;
  creditBalance: number;
  organization: {
    id: number;
    name: string;
    type: string;
    logo?: string | null;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  memberships: OrgMembership[];
  selectedOrg: { id: number; name: string; code?: string } | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadTokens: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setSelectedOrg: (org: { id: number; name: string; code?: string } | null) => Promise<void>;
  setMemberships: (memberships: OrgMembership[]) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  memberships: [],
  selectedOrg: null,

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken, organizations } = response.data.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    // Store organizations/memberships if present
    const memberships: OrgMembership[] = organizations || [];
    if (memberships.length > 0) {
      await SecureStore.setItemAsync('memberships', JSON.stringify(memberships));
    }

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      memberships,
    });
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { user, accessToken, refreshToken, organizations } = response.data.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    const memberships: OrgMembership[] = organizations || [];
    if (memberships.length > 0) {
      await SecureStore.setItemAsync('memberships', JSON.stringify(memberships));
    }

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      memberships,
    });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('memberships');
    await SecureStore.deleteItemAsync('selectedOrg');

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      memberships: [],
      selectedOrg: null,
    });
  },

  loadTokens: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken });

        // Load persisted memberships and selectedOrg
        let memberships: OrgMembership[] = [];
        let selectedOrg: { id: number; name: string; code?: string } | null = null;

        try {
          const membershipsJson = await SecureStore.getItemAsync('memberships');
          if (membershipsJson) {
            memberships = JSON.parse(membershipsJson);
          }
        } catch {
          // ignore parse errors
        }

        try {
          const selectedOrgJson = await SecureStore.getItemAsync('selectedOrg');
          if (selectedOrgJson) {
            selectedOrg = JSON.parse(selectedOrgJson);
          }
        } catch {
          // ignore parse errors
        }

        // Verify token by fetching user profile
        try {
          const response = await api.get('/auth/me');
          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
            memberships,
            selectedOrg,
          });
        } catch {
          // Token invalid/expired, clear everything
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          await SecureStore.deleteItemAsync('memberships');
          await SecureStore.deleteItemAsync('selectedOrg');
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            memberships: [],
            selectedOrg: null,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data });
    } catch {
      // Silently fail — interceptor handles 401
    }
  },

  setSelectedOrg: async (org) => {
    if (org) {
      await SecureStore.setItemAsync('selectedOrg', JSON.stringify(org));
    } else {
      await SecureStore.deleteItemAsync('selectedOrg');
    }
    set({ selectedOrg: org });
  },

  setMemberships: async (memberships) => {
    await SecureStore.setItemAsync('memberships', JSON.stringify(memberships));
    set({ memberships });
  },
}));
