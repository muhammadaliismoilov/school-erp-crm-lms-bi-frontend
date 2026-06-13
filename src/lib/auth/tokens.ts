/**
 * Framework-agnostic token persistence shared by the API client and the React
 * auth store. Kept outside React so the fetch layer can read/refresh tokens
 * without importing component code.
 *
 * Access + refresh tokens live in localStorage so a page reload keeps the
 * session; the access token is short-lived and rotated on every refresh.
 */
const ACCESS_KEY = "yuton.accessToken";
const REFRESH_KEY = "yuton.refreshToken";

let accessToken: string | null = null;
let refreshToken: string | null = null;

if (typeof window !== "undefined") {
  accessToken = window.localStorage.getItem(ACCESS_KEY);
  refreshToken = window.localStorage.getItem(REFRESH_KEY);
}

export const tokenStore = {
  get access(): string | null {
    return accessToken;
  },
  get refresh(): string | null {
    return refreshToken;
  },
  set(access: string, refresh: string): void {
    accessToken = access;
    refreshToken = refresh;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_KEY, access);
      window.localStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  clear(): void {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    }
  },
};
