import { ApiExplorer } from "@/components/explorer/api-explorer";
import { API_MODULES, API_TOTAL_ENDPOINTS } from "@/lib/api/manifest";

export default function ExplorerPage({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Backend API konsoli</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            API Explorer
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Backenddagi <strong className="text-ink">{API_MODULES.length}</strong>{" "}
            modul va{" "}
            <strong className="text-amber">{API_TOTAL_ENDPOINTS}</strong> ta
            endpoint — barchasi shu yerda jonli ulangan. Har birini to‘ldirib
            yuboring va javobini ko‘ring.
          </p>
        </div>
      </div>
      <ApiExplorer initialModule={searchParams.m} />
    </div>
  );
}
