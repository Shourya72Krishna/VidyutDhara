import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login(credentials);
          localStorage.setItem('vd_token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return data;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.register(userData);
          localStorage.setItem('vd_token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return data;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch {}
        localStorage.removeItem('vd_token');
        set({ user: null, token: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      refreshUser: async () => {
        try {
          const { data } = await authAPI.me();
          set({ user: data.user, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'vidyutdhar-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
