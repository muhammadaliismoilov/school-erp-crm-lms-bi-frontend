"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils";

const statusTone: Record<string, "positive" | "caution" | "negative" | "neutral"> = {
  approved: "positive",
  pending: "caution",
  rejected: "negative",
};

const columns: Column<ResourceRecord>[] = [
  {
    key: "fullName",
    header: "Murojaatchi",
    render: (r) => (
      <span className="font-medium text-ink">{String(r.fullName ?? r.full_name ?? "—")}</span>
    ),
  },
  { key: "type", header: "Turi", render: (r) => String(r.type ?? "—") },
  { key: "phone", header: "Telefon", render: (r) => String(r.phone ?? "—") },
  { key: "createdAt", header: "Sana", render: (r) => formatDate(r.createdAt as string) },
  {
    key: "status",
    header: "Holat",
    render: (r) => (
      <Badge tone={statusTone[String(r.status)] ?? "neutral"}>{String(r.status ?? "—")}</Badge>
    ),
  },
];

export default function GradeRequestsPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.gradeRequests")}
      subtitle="Baho va boshqa murojaatlarni ko‘rib chiqish"
      queryKey="appeals"
      path="/appeals"
      columns={columns}
      searchFields={["fullName", "phone"]}
    />
  );
}
