import { tokenStore } from "@/lib/auth/tokens";

/**
 * Low-level endpoint runner used by the API Explorer. Unlike `apiRequest`, it
 * never throws and never unwraps the envelope — it returns the full response
 * (status, timing, raw JSON) so the console can show exactly what the backend
 * sent, success or error. Auth token + Accept-Language are attached
 * automatically, mirroring the real app's requests.
 */

const DEFAULT_BASE = "/api/v1";

export interface RunResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  /** Parsed JSON body, or raw text if not JSON. */
  body: unknown;
  /** Network/parse failure message, if the request never completed. */
  networkError?: string;
}

function currentLocale(): string {
  if (typeof window === "undefined") return "uz";
  try {
    return window.localStorage.getItem("yuton.locale") || "uz";
  } catch {
    return "uz";
  }
}

export interface RunOptions {
  method: string;
  /** Path under the API base, e.g. "/students" or "/students/abc". */
  path: string;
  /** API base — "/api/v1" by default, "/api" for version-neutral controllers. */
  apiBase?: string;
  query?: Record<string, string>;
  body?: unknown;
  /** Attach the bearer token (default true). */
  auth?: boolean;
}

export async function runEndpoint(opts: RunOptions): Promise<RunResult> {
  const { method, path, query, body, auth = true, apiBase = DEFAULT_BASE } = opts;

  const url = new URL(`${apiBase}${path}`, "http://internal");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }
  const finalUrl = `${url.pathname}${url.search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": currentLocale(),
  };
  const hasBody = body !== undefined && method !== "GET" && method !== "DELETE";
  if (hasBody) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) {
    headers.Authorization = `Bearer ${tokenStore.access}`;
  }

  const started = performance.now();
  try {
    const res = await fetch(finalUrl, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const durationMs = Math.round(performance.now() - started);

    let parsed: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs,
      body: parsed,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: "Network error",
      durationMs: Math.round(performance.now() - started),
      body: null,
      networkError: err instanceof Error ? err.message : String(err),
    };
  }
}
