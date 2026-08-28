"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useUsersBySchool, type SchoolUserBreakdownRow } from "@/lib/api/users";
import { setActiveSchool } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";

/**
 * Kesim chizilsinmi.
 *
 * Bitta qator = maktabga bog'langan foydalanuvchi. Kartalar allaqachon shu
 * raqamlarni ko'rsatyapti, kesim takror bo'lardi.
 */
export function shouldRenderBreakdown(rows: SchoolUserBreakdownRow[] | undefined): boolean {
  return (rows?.length ?? 0) >= 2;
}

/** "Maktabsiz" qatorida (global hisoblar) o'tadigan maktab yo'q. */
export function isRowClickable(row: Pick<SchoolUserBreakdownRow, "schoolId">): boolean {
  return Boolean(row.schoolId);
}

/**
 * Maktablar bo'yicha foydalanuvchi kesimi.
 *
 * NEGA: CEO "har maktabda nechta?" degan savolni aynan shu sahifada beradi.
 * Ilgari yuqorida bitta 1 192 raqami turardi va u savolga javob bermasdi —
 * ustiga-ustak har maktabda bir xil ko'rinardi (statistika filtrlanmagan edi).
 *
 * Qator bosilsa maktab tanlanadi: raqamni ko'rish va unga o'tish uzilmasin.
 */
export function SchoolBreakdown() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading } = useUsersBySchool();

  if (isLoading || !data || !shouldRenderBreakdown(data)) return null;

  const eng = Math.max(...data.map((row) => row.accounts), 1);

  function tanla(row: SchoolUserBreakdownRow) {
    if (!isRowClickable(row)) return;
    setActiveSchool(row.schoolId);
    qc.invalidateQueries();
  }

  return (
    <Card className="mb-5 p-5">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {t("users.bySchool")}
      </p>

      <div className="divide-y divide-line">
        {data.map((row) => {
          const bosiladi = isRowClickable(row);
          return (
            <button
              key={row.schoolId ?? "global"}
              type="button"
              onClick={() => tanla(row)}
              disabled={!bosiladi}
              className={cn(
                "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5 text-left transition-colors sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]",
                bosiladi ? "hover:bg-parchment-deep" : "cursor-default",
              )}
            >
              <span className="truncate text-sm font-medium text-ink">{row.name}</span>

              {/* Ustun — nisbatni bir qarashda ko'rsatadi, o'qishni to'smaydi. */}
              <span className="hidden h-1.5 overflow-hidden rounded-full bg-parchment-deep sm:block">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${Math.max((row.accounts / eng) * 100, 2)}%` }}
                />
              </span>

              <span className="flex items-baseline justify-end gap-4 tnum">
                <span className="text-sm font-medium text-ink">{formatMoney(row.accounts)}</span>
                <span className="w-16 text-right text-xs text-ink-muted">
                  {formatMoney(row.students)}
                </span>
                <span
                  className={cn(
                    "w-14 text-right text-xs",
                    // Nol faol — jimgina o'tib ketmasin.
                    row.active === 0 ? "text-caution" : "text-ink-muted",
                  )}
                >
                  {formatMoney(row.active)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-baseline justify-end gap-4 text-[10px] uppercase tracking-wider text-ink-muted">
        <span>{t("users.stats.accounts")}</span>
        <span className="w-16 text-right">{t("users.stats.students")}</span>
        <span className="w-14 text-right">{t("users.stats.active")}</span>
      </div>
    </Card>
  );
}
