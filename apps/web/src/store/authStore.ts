import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDTO } from '@resbar/shared';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDTO, accessToken: string) => void;
  updateUser: (user: UserDTO) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      updateUser: (user) => set({ user }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
