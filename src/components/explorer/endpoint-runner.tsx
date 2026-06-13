"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Copy, Lock, Play, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiEndpoint } from "@/lib/api/manifest";
import { runEndpoint, type RunResult } from "@/lib/api/raw";
import { tokenStore } from "@/lib/auth/tokens";
import { cn } from "@/lib/utils";

interface Props {
  base: string;
  endpoint: ApiEndpoint;
  /** "/api/v1" normally, "/api" for version-neutral controllers. */
  apiBase: string;
}

function templatePath(base: string, path: string): string {
  const segs = [base, path].filter(Boolean).join("/");
  return `/${segs}`;
}

function statusTone(status: number): string {
  if (status === 0) return "text-negative bg-negative/12";
  if (status >= 500) return "text-negative bg-negative/12";
  if (status >= 400) return "text-caution bg-caution/14";
  if (status >= 200 && status < 300) return "text-positive bg-positive/12";
  return "text-ink-soft bg-parchment-deep";
}

export function EndpointRunner({ base, endpoint, apiBase }: Props) {
  const tpl = templatePath(base, endpoint.path);

  const [params, setParams] = useState<Record<string, string>>({});
  const [queryText, setQueryText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset the builder whenever a different endpoint is selected.
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const p of endpoint.pathParams) init[p] = "";
    setParams(init);
    setQueryText(
      endpoint.query
        ? JSON.stringify(endpoint.query, null, 2)
        : endpoint.hasQuery
          ? "{\n  \n}"
          : "",
    );
    setBodyText(
      endpoint.hasBody && endpoint.body
        ? JSON.stringify(endpoint.body, null, 2)
        : endpoint.hasBody
          ? "{\n  \n}"
          : "",
    );
    setJsonError(null);
    setResult(null);
    setCopied(false);
  }, [endpoint]);

  const resolvedPath = useMemo(() => {
    let p = tpl;
    for (const name of endpoint.pathParams) {
      const v = params[name]?.trim();
      p = p.replace(`:${name}`, v ? encodeURIComponent(v) : `:${name}`);
    }
    return p;
  }, [tpl, params, endpoint.pathParams]);

  const hasToken = Boolean(tokenStore.access);
  const missingParams = endpoint.pathParams.some((n) => !params[n]?.trim());

  async function handleRun() {
    setJsonError(null);
    let query: Record<string, string> | undefined;
    let body: unknown;

    if (endpoint.hasQuery && queryText.trim()) {
      try {
        const obj = JSON.parse(queryText);
        query = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v !== undefined && v !== null && v !== "") query[k] = String(v);
        }
      } catch {
        setJsonError("Query JSON noto‘g‘ri — sintaksisni tekshiring.");
        return;
      }
    }
    if (endpoint.hasBody && bodyText.trim()) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        setJsonError("Body JSON noto‘g‘ri — sintaksisni tekshiring.");
        return;
      }
    }

    setRunning(true);
    setResult(null);
    const res = await runEndpoint({
      method: endpoint.verb,
      path: resolvedPath,
      apiBase,
      query,
      body,
    });
    setResult(res);
    setRunning(false);
  }

  function copyResponse() {
    if (!result) return;
    const text =
      typeof result.body === "string"
        ? result.body
        : JSON.stringify(result.body, null, 2);
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* request line */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <span
          className={cn(
            "rounded-md px-2 py-1 font-mono text-xs font-bold",
            `verb-${endpoint.verb}`,
          )}
        >
          {endpoint.verb}
        </span>
        <code className="font-mono text-sm text-ink">
          <span className="text-ink-muted">{apiBase}</span>
          {resolvedPath}
        </code>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="text-sm text-ink-soft">{endpoint.summary || "—"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {endpoint.perm && (
            <span className="inline-flex items-center gap-1 rounded-md bg-parchment-deep px-2 py-0.5 font-mono text-[11px] text-ink-muted">
              <Lock className="h-3 w-3" /> {endpoint.perm}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px]",
              hasToken
                ? "bg-positive/12 text-positive"
                : "bg-caution/14 text-caution",
            )}
          >
            {hasToken ? "token ulangan" : "token yo‘q — login qiling"}
          </span>
        </div>

        {/* path params */}
        {endpoint.pathParams.length > 0 && (
          <div className="mt-5">
            <p className="label mb-2">Path parametrlari</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {endpoint.pathParams.map((name) => (
                <label key={name} className="block">
                  <span className="mb-1 block font-mono text-xs text-ink-muted">
                    :{name}
                  </span>
                  <input
                    value={params[name] ?? ""}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, [name]: e.target.value }))
                    }
                    placeholder={`${name} qiymati`}
                    className="h-9 w-full rounded-lg border border-line bg-surface px-3 font-mono text-sm text-ink focus:border-accent focus-visible:focus-ring"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* query */}
        {endpoint.hasQuery && (
          <div className="mt-5">
            <p className="label mb-2">Query (JSON)</p>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              spellCheck={false}
              rows={4}
              className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] leading-relaxed text-ink focus:border-accent focus-visible:focus-ring"
            />
          </div>
        )}

        {/* body */}
        {endpoint.hasBody && (
          <div className="mt-5">
            <p className="label mb-2">Body (JSON)</p>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              spellCheck={false}
              rows={Math.min(
                18,
                Math.max(5, bodyText.split("\n").length + 1),
              )}
              className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] leading-relaxed text-ink focus:border-accent focus-visible:focus-ring"
            />
          </div>
        )}

        {jsonError && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-negative">
            <ShieldAlert className="h-4 w-4" /> {jsonError}
          </p>
        )}

        {/* response */}
        {result && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Javob</p>
              <button
                onClick={copyResponse}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-positive" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Nusxalandi" : "Nusxalash"}
              </button>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-mono text-xs font-bold",
                  statusTone(result.status),
                )}
              >
                {result.status || "ERR"} {result.statusText}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
                <Clock className="h-3 w-3" />
                {result.durationMs} ms
              </span>
            </div>
            <pre className="max-h-[42vh] overflow-auto rounded-xl border border-line bg-navy p-4 font-mono text-[12.5px] leading-relaxed text-paper/90">
              {result.networkError
                ? `// network error\n${result.networkError}`
                : typeof result.body === "string"
                  ? result.body
                  : JSON.stringify(result.body, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* run bar */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <span className="font-mono text-xs text-ink-muted">
          {missingParams
            ? "Path parametrlarini to‘ldiring"
            : "Yuborishga tayyor"}
        </span>
        <Button
          variant="accent"
          onClick={handleRun}
          loading={running}
          disabled={missingParams}
        >
          {!running && <Play className="h-4 w-4" />}
          So‘rovni yuborish
        </Button>
      </div>
    </div>
  );
}
