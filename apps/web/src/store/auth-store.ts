import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: string;
  roleDisplayName: string;
  permissions: string[];
}

export interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  plan?: string;
}

interface AuthState {
  user: UserInfo | null;
  company: CompanyInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserInfo, company: CompanyInfo, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<UserInfo>) => void;
  updateCompany: (company: Partial<CompanyInfo>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, company, accessToken, refreshToken) =>
        set({ user, company, accessToken, refreshToken: refreshToken ?? null, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, company: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
      updateCompany: (partialCompany) =>
        set((state) => ({
          company: state.company ? { ...state.company, ...partialCompany } : null,
        })),
    }),
    {
      name: 'buildtrack-auth-storage',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
