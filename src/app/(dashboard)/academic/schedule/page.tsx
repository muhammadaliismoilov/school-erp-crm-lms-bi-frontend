"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { fullName, loc, formatDate } from "@/lib/utils";

const statusTone: Record<string, "positive" | "neutral" | "negative"> = {
  completed: "positive",
  planned: "neutral",
  cancelled: "negative",
};

const columns: Column<ResourceRecord>[] = [
  { key: "lessonDate", header: "Sana", render: (r) => formatDate(r.lessonDate as string) },
  {
    key: "class",
    header: "Sinf",
    render: (r) => (
      <span className="font-medium text-ink">{loc((r.class as Record<string, unknown>)?.name)}</span>
    ),
  },
  { key: "subject", header: "Fan", render: (r) => loc((r.subject as Record<string, unknown>)?.name) },
  { key: "teacher", header: "O‘qituvchi", render: (r) => fullName(r.teacher) },
  { key: "topic", header: "Mavzu", render: (r) => (r.topic ? String(r.topic) : "—") },
  {
    key: "status",
    header: "Holat",
    render: (r) => (
      <Badge tone={statusTone[String(r.status)] ?? "neutral"}>{String(r.status ?? "—")}</Badge>
    ),
  },
];

export default function SchedulePage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.schedule")}
      subtitle="Sinf darslari jadvali"
      queryKey="lms-lessons"
      path="/lms/lessons"
      columns={columns}
    />
  );
}
