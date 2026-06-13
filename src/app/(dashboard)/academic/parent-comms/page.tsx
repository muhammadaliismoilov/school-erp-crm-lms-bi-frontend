"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils";

const columns: Column<ResourceRecord>[] = [
  {
    key: "name",
    header: "Kampaniya",
    render: (r) => <span className="font-medium text-ink">{String(r.name ?? "—")}</span>,
  },
  {
    key: "channel",
    header: "Kanal",
    render: (r) => <Badge tone="accent">{String(r.channel ?? "—")}</Badge>,
  },
  { key: "subject", header: "Mavzu", render: (r) => String(r.subject ?? "—") },
  {
    key: "scheduledAt",
    header: "Rejalashtirilgan",
    render: (r) => formatDate(r.scheduledAt as string),
  },
  {
    key: "status",
    header: "Holat",
    render: (r) => <Badge tone="neutral">{String(r.status ?? "—")}</Badge>,
  },
];

export default function ParentCommsPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.parentComms")}
      subtitle="Ota-onalarga yuborilgan xabar kampaniyalari"
      queryKey="communication-campaigns"
      path="/communication/campaigns"
      columns={columns}
      searchFields={["name", "subject"]}
    />
  );
}
