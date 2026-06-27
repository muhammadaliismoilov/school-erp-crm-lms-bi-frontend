"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useDebtsOverview } from "@/lib/api/debts";
import { DebtsKpiCards } from "@/components/finance/debts-kpi-cards";
import { DebtsChart } from "@/components/finance/debts-chart";
import { MonthlyBreakdownTable } from "@/components/finance/monthly-breakdown-table";
import { StudentDebtsTable } from "@/components/finance/student-debts-table";

/** Moliya → Qarzlar: KPI + chart + oylik taqsimot + o'quvchilar qarzlari matritsasi. */
export default function DebtsPage() {
  const { data } = useDebtsOverview();

  return (
    <div className="space-y-5">
      <PageHeader title="Qarzlar" subtitle="O‘quvchilar to‘lov qarzlari va yig‘ish dinamikasi" />
      <DebtsKpiCards data={data} />
      <DebtsChart data={data} />
      <MonthlyBreakdownTable data={data} />
      <StudentDebtsTable />
    </div>
  );
}
