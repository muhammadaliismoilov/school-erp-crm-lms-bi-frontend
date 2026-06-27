"use client";

import { Percent, TrendingDown, Users, Wallet } from "lucide-react";
import type { DebtsOverviewResult } from "@/lib/api/debts";
import { formatMoney } from "@/lib/utils";
import { StatCard } from "@/components/students/stat-card";

/** 4 KPI: umumiy qoldiq qarz, qarzdor o'quvchilar, yig'ish foizi (joriy oy), yig'ilgan summa (joriy oy). */
export function DebtsKpiCards({ data }: { data?: DebtsOverviewResult }) {
  const kpi = data?.kpi;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Umumiy qoldiq qarz"
        value={kpi ? formatMoney(kpi.totalOutstanding) : "—"}
        hint="UZS"
        icon={<TrendingDown className="h-5 w-5" />}
        tone="rose"
      />
      <StatCard
        label="Qarzdor o‘quvchilar"
        value={kpi ? String(kpi.debtorCount) : "—"}
        hint="ta"
        icon={<Users className="h-5 w-5" />}
        tone="amber"
      />
      <StatCard
        label="Yig‘ish foizi (joriy oy)"
        value={kpi ? `${Math.round(kpi.currentMonthRate)}%` : "—"}
        icon={<Percent className="h-5 w-5" />}
        tone="sky"
      />
      <StatCard
        label="Yig‘ilgan summa (joriy oy)"
        value={kpi ? formatMoney(kpi.currentMonthCollected) : "—"}
        hint="UZS"
        icon={<Wallet className="h-5 w-5" />}
        tone="accent"
      />
    </div>
  );
}
