"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn, loc } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { cellKey, type QuarterCell, type QuarterView, type QuarterWeek } from "@/lib/api/schedule";

interface Props {
  view: QuarterView;
  days: number[];
  mode: "class" | "teacher";
  /** Berilsa, kataklar bosilib tahrirlanadi (admin). */
  onEditCell?: (cell: QuarterCell, periodId: string) => void;
}

/** "05.09 – 11.09" ko'rinishidagi hafta oralig'i yorlig'i. */
function rangeLabel(start: string, end: string): string {
  const fmt = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function QuarterViewGrid({ view, days, mode, onEditCell }: Props) {
  const { t } = useI18n();
  const weekLabel = (n: number) => t("sched.weekN").replace("{n}", String(n));

  // Joriy hafta (yoki birinchi hafta) sukut bo'yicha ochiq.
  const currentKey = useMemo(() => {
    const cur = view.weeks.find((w) => w.isCurrent);
    return cur?.startDate ?? view.weeks[0]?.startDate ?? null;
  }, [view.weeks]);

  const [open, setOpen] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (currentKey) setOpen(new Set([currentKey]));
  }, [currentKey]);

  // Joriy haftaga avtomatik skroll.
  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentKey]);

  // Bosmadan oldin barcha haftalar ochiladi (aks holda faqat ochiqlari chiqadi).
  useEffect(() => {
    const expandForPrint = () => setOpen(new Set(view.weeks.map((w) => w.startDate)));
    window.addEventListener("beforeprint", expandForPrint);
    return () => window.removeEventListener("beforeprint", expandForPrint);
  }, [view.weeks]);

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const allOpen = open.size === view.weeks.length;
  const toggleAll = () =>
    setOpen(allOpen ? new Set() : new Set(view.weeks.map((w) => w.startDate)));

  const hasAnyLesson = view.weeks.some((w) => Object.keys(w.cells).length > 0);
  if (!hasAnyLesson) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-20 text-center">
        <p className="text-sm text-ink-muted">{t("sched.quarterEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="no-print flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-accent hover:underline"
        >
          {allOpen ? t("sched.collapseAll") : t("sched.expandAll")}
        </button>
      </div>

      {view.weeks.map((week) => {
        const isOpen = open.has(week.startDate);
        const count = Object.keys(week.cells).length;
        return (
          <div
            key={week.startDate}
            ref={week.isCurrent ? currentRef : undefined}
            className={cn(
              "print-block overflow-hidden rounded-xl border bg-surface",
              week.isCurrent ? "border-accent/50" : "border-line",
            )}
          >
            <button
              type="button"
              onClick={() => toggle(week.startDate)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-parchment"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-ink-muted transition-transform",
                  isOpen && "rotate-180",
                )}
              />
              <span className="text-sm font-semibold text-ink">{weekLabel(week.weekNumber)}</span>
              <span className="text-xs text-ink-muted">{rangeLabel(week.startDate, week.endDate)}</span>
              {week.isCurrent && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {t("sched.today")}
                </span>
              )}
              <span className="ml-auto text-xs text-ink-muted">
                {count} {t("sched.wz.unit.lesson")}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-line">
                <WeekGrid week={week} days={days} periods={view.periods} mode={mode} onEditCell={onEditCell} />
              </div>
            )}
          </div>
        );
      })}

      {view.subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-parchment px-3 py-2.5">
          <span className="text-xs font-medium text-ink-muted">{t("sched.legend")}:</span>
          {view.subjects.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {loc(s.name)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekGrid({
  week,
  days,
  periods,
  mode,
  onEditCell,
}: {
  week: QuarterWeek;
  days: number[];
  periods: QuarterView["periods"];
  mode: "class" | "teacher";
  onEditCell?: (cell: QuarterCell, periodId: string) => void;
}) {
  const { t } = useI18n();
  const gridCols = { gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div className="overflow-x-auto">
      {/* Kunlar sarlavhasi */}
      <div className="grid border-b border-line bg-parchment/50" style={gridCols}>
        <div className="px-2 py-2" />
        {days.map((d) => (
          <div key={d} className="px-3 py-2 text-center text-xs font-semibold text-ink">
            {t(`sched.day.${d}`)}
          </div>
        ))}
      </div>

      {periods.map((period) => (
        <div key={period.id} className="grid border-b border-line last:border-b-0" style={gridCols}>
          <div className="flex flex-col items-center justify-center border-r border-line px-1 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-xs font-semibold text-ink">
              {period.code}
            </span>
            <span className="mt-1 text-[10px] leading-tight text-ink-muted">
              {period.startTime?.slice(0, 5)}
            </span>
            <span className="text-[10px] leading-tight text-ink-muted">{period.endTime?.slice(0, 5)}</span>
          </div>

          {days.map((day) => {
            const cell = week.cells[cellKey(day, period.id)];
            if (!cell) {
              return <div key={day} className="min-h-[60px] border-r border-line last:border-r-0" />;
            }
            const editable = Boolean(onEditCell);
            return (
              <div
                key={day}
                role={editable ? "button" : undefined}
                tabIndex={editable ? 0 : undefined}
                onClick={editable ? () => onEditCell?.(cell, period.id) : undefined}
                onKeyDown={
                  editable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEditCell?.(cell, period.id);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "min-h-[60px] border-r border-line p-2 last:border-r-0",
                  editable && "cursor-pointer hover:bg-parchment focus-visible:focus-ring",
                )}
              >
                <div className="flex items-start gap-1.5">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cell.subjectColor ?? "#94a3b8" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{loc(cell.subjectName)}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {mode === "teacher" ? cell.className : cell.teacherName ?? "—"}
                    </p>
                    {cell.roomName && (
                      <p className="truncate text-[11px] text-ink-muted/80">{cell.roomName}</p>
                    )}
                    {cell.isSubstituted && (
                      <span className="mt-0.5 inline-block rounded-full bg-amber/10 px-1.5 text-[10px] text-amber">
                        ⇄
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
