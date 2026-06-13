import { apiRequest } from "./client";
import type { AuthTokens } from "./types";

export const authApi = {
  login(login: string, password: string): Promise<AuthTokens> {
    return apiRequest<AuthTokens>("/auth/login", {
      method: "POST",
      body: { login, password },
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
