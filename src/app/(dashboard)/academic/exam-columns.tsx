import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { loc, formatDate } from "@/lib/utils";

/**
 * Imtihon jadvali ustunlari — progress-exams va state-exam sahifalari ulashadi.
 * Page faylidan tashqarida turishi shart: Next.js page'lardan ixtiyoriy export'ni
 * taqiqlaydi.
 */
export const examColumns: Column<ResourceRecord>[] = [
  {
    key: "title",
    header: "Imtihon",
    render: (r) => <span className="font-medium text-ink">{String(r.title ?? "—")}</span>,
  },
  { key: "class", header: "Sinf", render: (r) => loc((r.class as Record<string, unknown>)?.name) },
  { key: "subject", header: "Fan", render: (r) => loc((r.subject as Record<string, unknown>)?.name) },
  { key: "examDate", header: "Sana", render: (r) => formatDate(r.examDate as string) },
  { key: "maxScore", header: "Maks. ball", align: "right", render: (r) => String(r.maxScore ?? "—") },
  {
    key: "status",
    header: "Holat",
    render: (r) => <Badge tone="neutral">{String(r.status ?? "—")}</Badge>,
  },
];
