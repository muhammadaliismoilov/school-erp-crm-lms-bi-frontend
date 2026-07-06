import { apiRequest } from "./client";
import type { AuthTokens } from "./types";

/** 2FA yoqilgan foydalanuvchi uchun login birinchi bosqichi javobi. */
export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  twoFactorToken: string;
}

export function isTwoFactorChallenge(r: AuthTokens | TwoFactorChallenge): r is TwoFactorChallenge {
  return (r as TwoFactorChallenge).requiresTwoFactor === true;
}

export const authApi = {
  login(login: string, password: string): Promise<AuthTokens | TwoFactorChallenge> {
    return apiRequest<AuthTokens | TwoFactorChallenge>("/auth/login", {
      method: "POST",
      body: { login, password },
      auth: false,
    });
  },
  verifyTwoFactor(twoFactorToken: string, code: string): Promise<AuthTokens> {
    return apiRequest<AuthTokens>("/auth/2fa/verify", {
      method: "POST",
      body: { twoFactorToken, code },
      auth: false,
    });
  },
  logout(refreshToken: string): Promise<unknown> {
    return apiRequest("/auth/logout", {
      method: "POST",
      body: { refreshToken },
      auth: false,
      retryOnUnauthorized: false,
    });
  },
};
