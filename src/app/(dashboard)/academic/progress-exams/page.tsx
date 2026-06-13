"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { loc, formatDate } from "@/lib/utils";

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

export default function ProgressExamsPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.progressExams")}
      subtitle="Choraklik va oraliq imtihonlar"
      queryKey="lms-exams"
      path="/lms/exams"
      columns={examColumns}
      searchFields={["title"]}
    />
  );
}
