"use client";

import { useState } from "react";
import { useResourceArray, type ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";

const tone: Record<string, "positive" | "neutral" | "caution" | "negative"> = {
  present: "positive",
  late: "caution",
  excused: "neutral",
  absent: "negative",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { t } = useI18n();
  const [date, setDate] = useState(today());

  const { data, isLoading, isError, refetch } = useResourceArray(
    "attendance",
    "/attendance/students",
    { date },
    Boolean(date),
  );

  const columns: Column<ResourceRecord>[] = [
    {
      key: "studentId",
      header: "O‘quvchi",
      render: (r) => (
        <span className="font-mono text-xs text-ink-soft">
          {String(r.studentId ?? r.id).slice(0, 8)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Holat",
      render: (r) => (
        <Badge tone={tone[String(r.status ?? "present")] ?? "neutral"}>
          {String(r.status ?? "—")}
        </Badge>
      ),
    },
    {
      key: "checkInTime",
      header: "Kelgan vaqti",
      className: "tnum",
      render: (r) => String(r.checkInTime ?? "—"),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("nav.attendance")}
        subtitle="O‘quvchilar davomati (sana bo‘yicha)"
        action={
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        }
      />
      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        page={1}
        pageCount={1}
        total={data?.length ?? 0}
        onPageChange={() => undefined}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
