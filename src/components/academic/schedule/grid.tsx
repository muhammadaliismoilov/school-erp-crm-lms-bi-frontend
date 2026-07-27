"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { cn, loc } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { cellKey, type LessonCell, type ScheduleGrid } from "@/lib/api/schedule";

interface Props {
  grid: ScheduleGrid;
  days: number[];
  mode: "class" | "teacher";
  /** Tahrir amallarini yashiradi (ruxsati yo'q foydalanuvchi uchun). */
  readOnly?: boolean;
  onAdd?: (weekday: number, periodId: string) => void;
  onEdit?: (cell: LessonCell, weekday: number, periodId: string) => void;
  onDelete?: (cell: LessonCell, weekday: number, periodId: string) => void;
  onSubstitute?: (cell: LessonCell, weekday: number, periodId: string) => void;
}

export function ScheduleGridView({ grid, days, mode, readOnly, onAdd, onEdit, onDelete, onSubstitute }: Props) {
  const { t } = useI18n();
  const [menu, setMenu] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  // Faqat sinf rejimida VA ruxsat bo'lganda tahrir qilinadi.
  const interactive = mode === "class" && !readOnly;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const gridCols = { gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` };

  return (
    // `overflow-x-auto` YO'Q: ustunlar `minmax(0,1fr)` bilan siqiladi, gorizontal skroll
    // yuzaga kelmaydi, lekin u sticky sarlavhani buzardi.
    <div ref={ref} className="rounded-xl border border-line bg-surface print-grid">
      {/* Header — topbar (h-16) ostida yopishib turadi. */}
      <div
        className="sticky top-16 z-10 grid rounded-t-xl border-b border-line bg-parchment"
        style={gridCols}
      >
        <div className="px-2 py-3" />
        {days.map((d) => (
          <div key={d} className="px-3 py-3 text-center text-sm font-semibold text-ink">
            {t(`sched.day.${d}`)}
          </div>
        ))}
      </div>

      {/* Rows */}
      {grid.periods.map((period) => (
        <div key={period.id} className="grid border-b border-line last:border-b-0" style={gridCols}>
          <div className="flex flex-col items-center justify-center border-r border-line px-1 py-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-xs font-semibold text-ink">
              {period.code}
            </span>
            <span className="mt-1 text-[10px] leading-tight text-ink-muted">
              {period.startTime?.slice(0, 5)}
            </span>
            <span className="text-[10px] leading-tight text-ink-muted">{period.endTime?.slice(0, 5)}</span>
          </div>

          {days.map((day) => {
            const key = cellKey(day, period.id);
            const cell = grid.cells[key];
            const menuKey = `${key}`;
            if (!cell) {
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!interactive}
                  onClick={() => interactive && onAdd?.(day, period.id)}
                  className={cn(
                    "group relative min-h-[68px] border-r border-line p-2 text-left last:border-r-0",
                    interactive && "hover:bg-parchment",
                  )}
                >
                  {interactive && (
                    <span className="pointer-events-none flex h-full items-center justify-center text-ink-muted/50 group-hover:hidden">
                      {t("sched.empty")}
                    </span>
                  )}
                  {interactive && (
                    <span className="absolute inset-0 hidden items-center justify-center group-hover:flex">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg">
                        <Plus className="h-4 w-4" />
                      </span>
                    </span>
                  )}
                </button>
              );
            }

            return (
              <div key={day} className="relative min-h-[68px] border-r border-line p-2 last:border-r-0">
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
                    {cell.isSubstituted && (
                      <span className="mt-0.5 inline-block rounded-full bg-amber/10 px-1.5 text-[10px] text-amber">
                        ⇄
                      </span>
                    )}
                  </div>
                  {interactive && (
                    <button
                      type="button"
                      onClick={() => setMenu(menu === menuKey ? null : menuKey)}
                      className="rounded p-0.5 text-ink-muted hover:bg-parchment hover:text-ink"
                      aria-label="menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {menu === menuKey && interactive && (
                  <div className="absolute right-2 top-8 z-10 w-44 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
                    <MenuItem
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      label={t("sched.menu.edit")}
                      onClick={() => {
                        setMenu(null);
                        onEdit?.(cell, day, period.id);
                      }}
                    />
                    <MenuItem
                      icon={<UserCog className="h-3.5 w-3.5" />}
                      label={t("sched.menu.substitute")}
                      onClick={() => {
                        setMenu(null);
                        onSubstitute?.(cell, day, period.id);
                      }}
                    />
                    <MenuItem
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      label={t("sched.menu.delete")}
                      danger
                      onClick={() => {
                        setMenu(null);
                        onDelete?.(cell, day, period.id);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      {grid.subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-xl border-t border-line bg-parchment px-3 py-2.5">
          <span className="text-xs font-medium text-ink-muted">{t("sched.legend")}:</span>
          {grid.subjects.map((s) => (
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

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-parchment",
        danger ? "text-negative" : "text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
