"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";

const columns: Column<ResourceRecord>[] = [
  {
    key: "login",
    header: "Login",
    render: (r) => <span className="font-mono text-xs text-ink-soft">{String(r.login ?? "—")}</span>,
  },
  {
    key: "fullName",
    header: "F.I.O.",
    render: (r) => <span className="font-medium text-ink">{String(r.fullName ?? "—")}</span>,
  },
  { key: "phone", header: "Telefon", render: (r) => String(r.phone ?? "—") },
  { key: "email", header: "Email", render: (r) => String(r.email ?? "—") },
];

export default function ParentsPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.parents")}
      subtitle="Ota-onalar (PARENT roli)"
      queryKey="academic-parents"
      path="/users"
      columns={columns}
      query={{ role: "PARENT" }}
      serverPaginated
    />
  );
}
