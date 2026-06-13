import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth";
import type { AuthenticatedUser } from "@/lib/api/types";
import { hasPermission } from "./permissions";
import { tokenStore } from "./tokens";

interface AuthState {
  user: AuthenticatedUser | null;
  status: "loading" | "authenticated" | "anonymous";
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Called by the API layer when a refresh fails. */
  forceSignOut: () => void;
  hydrate: () => void;
  can: (permission?: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "loading",

      async signIn(login, password) {
        const tokens = await authApi.login(login, password);
        tokenStore.set(tokens.accessToken, tokens.refreshToken);
        set({ user: tokens.user, status: "authenticated" });
      },

      async signOut() {
        const refresh = tokenStore.refresh;
        if (refresh) {
          await authApi.logout(refresh).catch(() => undefined);
        }
        tokenStore.clear();
        set({ user: null, status: "anonymous" });
      },

      forceSignOut() {
        tokenStore.clear();
        set({ user: null, status: "anonymous" });
      },

      hydrate() {
        const hasSession = Boolean(tokenStore.access && get().user);
        set({ status: hasSession ? "authenticated" : "anonymous" });
      },

      can(permission) {
        return hasPermission(get().user?.permissions, permission);
      },
    }),
    {
      name: "yuton.auth",
      // Only the user profile is persisted here; tokens live in tokenStore.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
