"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { fullName, loc, formatDate } from "@/lib/utils";

const columns: Column<ResourceRecord>[] = [
  {
    key: "name",
    header: "Kurs",
    render: (r) => <span className="font-medium text-ink">{loc(r.name)}</span>,
  },
  { key: "subject", header: "Fan", render: (r) => loc((r.subject as Record<string, unknown>)?.name) },
  {
    key: "quarter",
    header: "Chorak",
    render: (r) => loc((r.quarter as Record<string, unknown>)?.name),
  },
  {
    key: "period",
    header: "Muddat",
    render: (r) => `${formatDate(r.startDate as string)} – ${formatDate(r.endDate as string)}`,
  },
  { key: "teacher", header: "O‘qituvchi", render: (r) => fullName(r.teacher) },
  {
    key: "status",
    header: "Holat",
    render: (r) => <Badge tone="neutral">{String(r.status ?? "—")}</Badge>,
  },
];

export default function CalendarPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.calendar")}
      subtitle="Kurslar va o‘quv rejasi"
      queryKey="academic-courses"
      path="/academic/courses"
      columns={columns}
      serverPaginated
    />
  );
}
