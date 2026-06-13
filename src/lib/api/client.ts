import { tokenStore } from "@/lib/auth/tokens";
import {
  ApiError,
  type AuthTokens,
  type ErrorEnvelope,
  type Locale,
  type SuccessEnvelope,
} from "./types";

const BASE_URL = "/api/v1";

let activeLocale: Locale = "uz";
export function setApiLocale(locale: Locale): void {
  activeLocale = locale;
}

/** Called when refresh fails — wired by the auth provider to force logout. */
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Attach the bearer token (default true). */
  auth?: boolean;
  /** Allow one transparent token refresh on 401 (default true). */
  retryOnUnauthorized?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${BASE_URL}${path}`, "http://internal");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return `${url.pathname}${url.search}`;
}

// Shared in-flight refresh so concurrent 401s trigger only one refresh call.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const json = (await res.json()) as SuccessEnvelope<AuthTokens>;
        tokenStore.set(json.data.accessToken, json.data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    auth = true,
    retryOnUnauthorized = true,
  } = options;

  // FormData bodies are sent as-is so the browser sets the multipart boundary.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": activeLocale,
  };
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) {
    headers.Authorization = `Bearer ${tokenStore.access}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body:
      body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 && auth && retryOnUnauthorized) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
    onAuthFailure?.();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const payload = (await res.json().catch(() => null)) as
    | SuccessEnvelope<T>
    | ErrorEnvelope
    | null;

  if (!res.ok || !payload || payload.success === false) {
    const err = (payload as ErrorEnvelope | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "REQUEST_FAILED",
      err?.message ?? `Request failed with status ${res.status}`,
      err?.messages,
    );
  }

  return payload.data;
}
