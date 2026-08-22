import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, isTwoFactorChallenge } from "@/lib/api/auth";
import type { AuthenticatedUser } from "@/lib/api/types";
import { hasPermission } from "./permissions";
import { tokenStore } from "./tokens";

interface AuthState {
  user: AuthenticatedUser | null;
  status: "loading" | "authenticated" | "anonymous";
  /**
   * `forceSignOut()` (token yangilash muvaffaqiyatsiz) sababli anonim bo'lindimi —
   * shunda login sahifasi "sessiya tugadi" xabarini ko'rsatadi. Oddiy `signOut()`
   * yoki hech qachon kirilmagan holatda `false`. Saqlanmaydi (faqat joriy sessiya).
   */
  sessionExpired: boolean;
  /** 2FA talab qilinsa twoFactorToken qaytadi (token saqlanmaydi) — UI kod bosqichiga o'tadi. */
  signIn: (login: string, password: string) => Promise<{ twoFactorToken?: string }>;
  /** 2FA ikkinchi bosqichi — kod tasdiqlanib to'liq kirish. */
  verifyTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
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
      sessionExpired: false,

      async signIn(login, password) {
        const res = await authApi.login(login, password);
        if (isTwoFactorChallenge(res)) {
          return { twoFactorToken: res.twoFactorToken };
        }
        tokenStore.set(res.accessToken, res.refreshToken);
        set({ user: res.user, status: "authenticated", sessionExpired: false });
        return {};
      },

      async verifyTwoFactor(twoFactorToken, code) {
        const tokens = await authApi.verifyTwoFactor(twoFactorToken, code);
        tokenStore.set(tokens.accessToken, tokens.refreshToken);
        set({ user: tokens.user, status: "authenticated", sessionExpired: false });
      },

      async signOut() {
        const refresh = tokenStore.refresh;
        if (refresh) {
          await authApi.logout(refresh).catch(() => undefined);
        }
        tokenStore.clear();
        set({ user: null, status: "anonymous", sessionExpired: false });
      },

      forceSignOut() {
        tokenStore.clear();
        set({ user: null, status: "anonymous", sessionExpired: true });
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
