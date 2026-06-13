import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { fullName, loc, formatDate } from "@/lib/utils";

const statusTone: Record<string, "positive" | "neutral" | "caution" | "negative"> = {
  active: "positive",
  applicant: "caution",
  transferred: "neutral",
  graduated: "neutral",
  withdrawn: "negative",
};

/**
 * O'quvchi jadvali ustunlari — students va departed sahifalari ulashadi.
 * Page faylidan tashqarida: Next.js page'lardan ixtiyoriy export'ni taqiqlaydi.
 */
export const studentColumns: Column<ResourceRecord>[] = [
  {
    key: "studentCode",
    header: "Kod",
    render: (r) => <span className="font-mono text-xs text-ink-soft">{String(r.studentCode ?? "—")}</span>,
  },
  {
    key: "fullName",
    header: "F.I.O.",
    render: (r) => <span className="font-medium text-ink">{fullName(r)}</span>,
  },
  { key: "class", header: "Sinf", render: (r) => loc((r.currentClass as Record<string, unknown>)?.name) },
  { key: "birthDate", header: "Tug‘ilgan sana", render: (r) => formatDate(r.birthDate as string) },
  {
    key: "status",
    header: "Holat",
    render: (r) => (
      <Badge tone={statusTone[String(r.status)] ?? "neutral"}>{String(r.status ?? "—")}</Badge>
    ),
  },
];
