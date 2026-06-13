"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { API_MODULES, API_TOTAL_ENDPOINTS, type ApiEndpoint } from "@/lib/api/manifest";
import { cn } from "@/lib/utils";
import { moduleIcon } from "./icons";
import { EndpointRunner } from "./endpoint-runner";

interface Selection {
  moduleIndex: number;
  endpointIndex: number;
}

export function ApiExplorer({ initialModule }: { initialModule?: string }) {
  const startIndex = Math.max(
    0,
    API_MODULES.findIndex((m) => m.module === initialModule),
  );

  const [activeModule, setActiveModule] = useState(startIndex);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();

  // Global search across every endpoint of every module.
  const searchResults = useMemo(() => {
    if (!q) return null;
    const hits: { mi: number; ei: number; ep: ApiEndpoint; label: string }[] =
      [];
    API_MODULES.forEach((m, mi) => {
      m.endpoints.forEach((ep, ei) => {
        const hay =
          `${m.module} ${m.label} ${ep.verb} ${ep.path} ${ep.summary} ${ep.perm}`.toLowerCase();
        if (hay.includes(q)) hits.push({ mi, ei, ep, label: m.label });
      });
    });
    return hits.slice(0, 80);
  }, [q]);

  const activeMod = API_MODULES[activeModule];
  const selected =
    selection != null
      ? API_MODULES[selection.moduleIndex]?.endpoints[selection.endpointIndex]
      : null;
  const selectedModule =
    selection != null ? API_MODULES[selection.moduleIndex] : null;
  const selectedBase = selectedModule?.base ?? "";
  const selectedApiBase = selectedModule?.versionNeutral ? "/api" : "/api/v1";

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_360px_minmax(0,1fr)]">
      {/* module rail */}
      <aside className="card flex max-h-[78vh] flex-col overflow-hidden">
        <div className="border-b border-line p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Endpoint qidirish…"
              className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-8 text-sm text-ink placeholder:text-ink-muted/70 focus:border-accent focus-visible:focus-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {API_MODULES.map((m, mi) => {
            const Icon = moduleIcon(m.icon);
            const active = mi === activeModule && !q;
            return (
              <button
                key={m.module}
                onClick={() => {
                  setActiveModule(mi);
                  setSearch("");
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-accent/15 text-ink"
                    : "text-ink-soft hover:bg-parchment-deep/60 hover:text-ink",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-amber" : "text-ink-muted",
                  )}
                />
                <span className="flex-1 truncate">{m.label}</span>
                <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                  {m.endpoints.length}
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-line px-3 py-2 font-mono text-[11px] text-ink-muted">
          {API_MODULES.length} modul · {API_TOTAL_ENDPOINTS} endpoint
        </div>
      </aside>

      {/* endpoint list */}
      <section className="card flex max-h-[78vh] flex-col overflow-hidden xl:col-auto">
        <div className="border-b border-line px-4 py-3">
          {q ? (
            <p className="text-sm font-semibold text-ink">
              “{search}” bo‘yicha {searchResults?.length ?? 0} natija
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-bold text-ink">
                {activeMod.label}
              </p>
              <span className="font-mono text-xs text-ink-muted">
                /api/v1/{activeMod.base}
              </span>
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {(q ? searchResults ?? [] : activeMod.endpoints.map((ep, ei) => ({
            mi: activeModule,
            ei,
            ep,
            label: activeMod.label,
          }))).map(({ mi, ei, ep, label }) => {
            const isSel =
              selection?.moduleIndex === mi && selection?.endpointIndex === ei;
            return (
              <button
                key={`${mi}-${ei}`}
                onClick={() =>
                  setSelection({ moduleIndex: mi, endpointIndex: ei })
                }
                className={cn(
                  "flex w-full items-start gap-2.5 border-b border-line/70 px-4 py-2.5 text-left transition-colors last:border-0",
                  isSel ? "bg-accent/10" : "hover:bg-parchment-deep/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 w-14 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-bold",
                    `verb-${ep.verb}`,
                  )}
                >
                  {ep.verb}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[13px] text-ink">
                    /{[API_MODULES[mi].base, ep.path].filter(Boolean).join("/")}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {q && <span className="text-amber">{label} · </span>}
                    {ep.summary || "—"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* runner */}
      <section className="card max-h-[78vh] overflow-hidden xl:col-auto lg:col-span-2 xl:col-span-1">
        {selected && selectedBase != null ? (
          <EndpointRunner
            key={`${selection?.moduleIndex}-${selection?.endpointIndex}`}
            base={selectedBase}
            apiBase={selectedApiBase}
            endpoint={selected}
          />
        ) : (
          <div className="grid h-full min-h-[40vh] place-items-center p-8 text-center">
            <div>
              <p className="font-display text-lg font-bold text-ink">
                Endpoint tanlang
              </p>
              <p className="mt-1 max-w-xs text-sm text-ink-muted">
                Chapdan modul va undagi endpointni tanlang — so‘rovni shu yerda
                to‘ldirib, jonli yuborib, javobini ko‘rasiz.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
