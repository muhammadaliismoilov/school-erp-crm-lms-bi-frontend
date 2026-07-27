"use client";

import { useMemo, useState } from "react";
import { cn, loc } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Drawer } from "@/components/ui/drawer";
import { type QuarterCell, type QuarterView } from "@/lib/api/schedule";

interface Props {
  view: QuarterView;
  mode: "class" | "teacher";
  /** Berilsa, kun tafsilotidagi darslar bosilib tahrirlanadi (admin). */
  onEditCell?: (cell: QuarterCell, periodId: string) => void;
}

const MONTHS: Record<string, string[]> = {
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** Bir dars katagi + tegishli para (vaqt/tartib uchun). */
interface DayLesson {
  cell: QuarterCell;
  periodId: string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

export function MonthViewGrid({ view, mode, onEditCell }: Props) {
  const { t, locale } = useI18n();
  const monthNames = MONTHS[locale] ?? MONTHS.en;
  const periodOrder = useMemo(
    () => new Map(view.periods.map((p) => [p.id, p.order])),
    [view.periods],
  );
  const periodById = useMemo(
    () => new Map(view.periods.map((p) => [p.id, p])),
    [view.periods],
  );

  // Sana → shu kundagi darslar (para tartibida).
  const byDate = useMemo(() => {
    const map = new Map<string, DayLesson[]>();
    for (const week of view.weeks) {
      for (const [key, cell] of Object.entries(week.cells)) {
        const periodId = key.split(":")[1];
        const list = map.get(cell.lessonDate) ?? [];
        list.push({ cell, periodId });
        map.set(cell.lessonDate, list);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => (periodOrder.get(a.periodId) ?? 0) - (periodOrder.get(b.periodId) ?? 0));
    }
    return map;
  }, [view.weeks, periodOrder]);

  // Chorak qamragan oylar ro'yxati (YYYY-MM).
  const months = useMemo(() => {
    const result: { year: number; month: number }[] = [];
    const start = new Date(`${view.startDate}T00:00:00Z`);
    const end = new Date(`${view.endDate}T00:00:00Z`);
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cursor <= end) {
      result.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return result;
  }, [view.startDate, view.endDate]);

  const [selected, setSelected] = useState<string | null>(null);
  const selectedLessons = selected ? byDate.get(selected) ?? [] : [];

  const hasAny = byDate.size > 0;
  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-20 text-center">
        <p className="text-sm text-ink-muted">{t("sched.quarterEmpty")}</p>
      </div>
    );
  }

  const weekdayHeads = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="space-y-6">
      {months.map(({ year, month }) => (
        <MonthCalendar
          key={`${year}-${month}`}
          year={year}
          month={month}
          title={`${monthNames[month]} ${year}`}
          weekdayHeads={weekdayHeads}
          byDate={byDate}
          onSelect={setSelected}
          t={t}
        />
      ))}

      {/* Fan legendasi */}
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

      {/* Kun tafsiloti */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? formatFullDate(selected, monthNames, t) : ""}
        subtitle={`${selectedLessons.length} ${t("sched.wz.unit.lesson")}`}
      >
        {selectedLessons.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("sched.noLessons")}</p>
        ) : (
          <ul className="space-y-2">
            {selectedLessons.map(({ cell, periodId }) => {
              const period = periodById.get(periodId);
              const editable = Boolean(onEditCell);
              return (
                <li
                  key={cell.id}
                  role={editable ? "button" : undefined}
                  tabIndex={editable ? 0 : undefined}
                  onClick={
                    editable
                      ? () => {
                          setSelected(null);
                          onEditCell?.(cell, periodId);
                        }
                      : undefined
                  }
                  className={cn(
                    "flex items-start gap-3 rounded-lg border border-line bg-surface p-3",
                    editable && "cursor-pointer hover:bg-parchment focus-visible:focus-ring",
                  )}
                >
                  <span className="flex flex-col items-center pt-0.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-xs font-semibold text-ink">
                      {period?.code}
                    </span>
                    <span className="mt-1 text-[10px] text-ink-muted">
                      {period?.startTime?.slice(0, 5)}
                    </span>
                  </span>
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cell.subjectColor ?? "#94a3b8" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{loc(cell.subjectName)}</p>
                    <p className="text-sm text-ink-muted">
                      {mode === "teacher" ? cell.className : cell.teacherName ?? "—"}
                      {cell.roomName ? ` · ${cell.roomName}` : ""}
                    </p>
                    {cell.isSubstituted && (
                      <span className="mt-1 inline-block rounded-full bg-amber/10 px-1.5 text-[10px] text-amber">
                        ⇄ {t("sched.menu.substitute")}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Drawer>
    </div>
  );
}

function MonthCalendar({
  year,
  month,
  title,
  weekdayHeads,
  byDate,
  onSelect,
  t,
}: {
  year: number;
  month: number;
  title: string;
  weekdayHeads: number[];
  byDate: Map<string, DayLesson[]>;
  onSelect: (date: string) => void;
  t: (k: string) => string;
}) {
  const today = todayStr();

  // Oyning birinchi kunidan oldingi dushanbadan boshlab, oxirgi kundan keyingi yakshanbagacha.
  const days = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1));
    const firstIso = first.getUTCDay() === 0 ? 7 : first.getUTCDay();
    const gridStart = new Date(first);
    gridStart.setUTCDate(gridStart.getUTCDate() - (firstIso - 1));
    const last = new Date(Date.UTC(year, month + 1, 0));
    const lastIso = last.getUTCDay() === 0 ? 7 : last.getUTCDay();
    const gridEnd = new Date(last);
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (7 - lastIso));

    const cells: Date[] = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setUTCDate(d.getUTCDate() + 1)) {
      cells.push(new Date(d));
    }
    return cells;
  }, [year, month]);

  // `overflow-hidden` YO'Q: sticky sarlavha uchun skroll konteyneri bo'lmasligi kerak.
  return (
    <div className="print-block rounded-xl border border-line bg-surface">
      {/* Oy nomi + hafta kunlari — topbar (h-16) ostida yopishib turadi. */}
      <div className="sticky top-16 z-10 rounded-t-xl bg-parchment">
        <div className="border-b border-line px-4 py-2.5">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>
        <div className="grid grid-cols-7 border-b border-line">
          {weekdayHeads.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-ink-muted">
              {t(`sched.day.${d}`).slice(0, 2)}
            </div>
          ))}
        </div>
      </div>

      {/* Kunlar */}
      <div className="grid grid-cols-7 overflow-hidden rounded-b-xl">
        {days.map((d) => {
          const dateStr = iso(d);
          const inMonth = d.getUTCMonth() === month;
          const lessons = byDate.get(dateStr) ?? [];
          const isToday = dateStr === today;
          const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={lessons.length === 0}
              onClick={() => lessons.length > 0 && onSelect(dateStr)}
              className={cn(
                "min-h-[92px] border-b border-r border-line p-1.5 text-left align-top last:border-r-0",
                !inMonth && "bg-parchment/40",
                isWeekend && inMonth && "bg-parchment/20",
                lessons.length > 0 && "hover:bg-parchment",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                  isToday ? "bg-accent font-semibold text-accent-fg" : "text-ink-muted",
                  !inMonth && "opacity-40",
                )}
              >
                {d.getUTCDate()}
              </span>
              {inMonth && lessons.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {lessons.slice(0, 3).map(({ cell }) => (
                    <div key={cell.id} className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cell.subjectColor ?? "#94a3b8" }}
                      />
                      <span className="truncate text-[10px] leading-tight text-ink-soft">
                        {loc(cell.subjectName)}
                      </span>
                    </div>
                  ))}
                  {lessons.length > 3 && (
                    <span className="text-[10px] font-medium text-accent">
                      +{lessons.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatFullDate(dateStr: string, monthNames: string[], t: (k: string) => string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const iso = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  return `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}, ${t(`sched.day.${iso}`)}`;
}
