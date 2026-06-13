"use client";

import { Users, FileText, CalendarCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/provider";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

interface AcademicOverview {
  students: number;
  contracts: number;
  attendanceRecords: number;
}

export default function ReportsPage() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "academic-overview"],
    queryFn: () => apiRequest<AcademicOverview>("/reports/academic-overview"),
  });

  const cards = [
    { icon: Users, label: "O‘quvchilar", value: data?.students, tone: "text-accent-fg" },
    { icon: FileText, label: "Shartnomalar", value: data?.contracts, tone: "text-amber" },
    {
      icon: CalendarCheck,
      label: "Davomat yozuvlari",
      value: data?.attendanceRecords,
      tone: "text-positive",
    },
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("nav.ac.reports")}
        subtitle="O‘zlashtirish va umumiy akademik ko‘rsatkichlar"
      />

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-negative/30 bg-negative/8 px-4 py-3 text-sm text-negative">
          {t("common.error")}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-parchment-deep text-ink-soft">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 font-display text-3xl font-bold tabular-nums text-ink">
                  {c.value ?? 0}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{c.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
