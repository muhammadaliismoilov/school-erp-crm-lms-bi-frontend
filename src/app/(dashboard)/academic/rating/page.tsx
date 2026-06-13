"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { useList } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fullName, cn } from "@/lib/utils";

export default function RatingPage() {
  const { t } = useI18n();
  const coins = useList("gamification-coins", "/gamification/coins");
  const students = useList("rating-students", "/students", { limit: 100 });

  const ranked = useMemo(() => {
    const names = new Map<string, string>();
    for (const s of students.rows) names.set(s.id, fullName(s));

    const totals = new Map<string, number>();
    for (const tx of coins.rows) {
      const sid = String(tx.studentId ?? "");
      if (!sid) continue;
      const amount = Number(tx.amount ?? 0);
      const signed = String(tx.type).toLowerCase().includes("debit") ? -amount : amount;
      totals.set(sid, (totals.get(sid) ?? 0) + signed);
    }

    return [...totals.entries()]
      .map(([id, total]) => ({ id, total, name: names.get(id) ?? id }))
      .sort((a, b) => b.total - a.total);
  }, [coins.rows, students.rows]);

  const loading = coins.isLoading || students.isLoading;

  return (
    <div className="stagger">
      <PageHeader
        title={t("nav.ac.rating")}
        subtitle="Tangalar (coin) bo‘yicha o‘quvchilar reytingi"
      />

      {loading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : ranked.length === 0 ? (
        <div className="card grid place-items-center border-dashed py-20 text-center">
          <Trophy className="mb-3 h-9 w-9 text-ink-muted/60" />
          <p className="text-sm text-ink-muted">Hozircha reyting ma'lumoti yo‘q</p>
        </div>
      ) : (
        <div className="card divide-y divide-line/70">
          {ranked.map((row, i) => (
            <div key={row.id} className="flex items-center gap-4 px-5 py-3">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                  i === 0
                    ? "bg-amber/20 text-amber"
                    : i === 1
                      ? "bg-ink-muted/15 text-ink-soft"
                      : i === 2
                        ? "bg-caution/15 text-caution"
                        : "bg-parchment-deep text-ink-muted",
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1 font-medium text-ink">{row.name}</span>
              <span className="tnum font-semibold text-accent-fg">
                <span className="text-ink">{row.total}</span>{" "}
                <span className="text-xs text-ink-muted">coin</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
