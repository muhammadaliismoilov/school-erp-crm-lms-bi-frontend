"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, FileSpreadsheet, History, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn, loc } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useQuarters, useSubjects } from "@/lib/api/academic";
import { useRooms } from "@/lib/api/rooms";
import { useCourseList } from "@/lib/api/courses";
import {
  useScheduleClasses,
  useScheduleTeachers,
  useScheduleGrid,
  useTeacherGrid,
  useQuarterView,
  useDeleteCell,
  visibleDays,
  type LessonCell,
  type QuarterCell,
} from "@/lib/api/schedule";
import {
  buildQuarterWorkbook,
  buildTemplateWorkbook,
  downloadXlsx,
  safeFileName,
  type ScheduleExportLabels,
} from "@/lib/export/schedule-xlsx";
import { ScheduleGridView } from "@/components/academic/schedule/grid";
import { QuarterViewGrid } from "@/components/academic/schedule/quarter-view";
import { MonthViewGrid } from "@/components/academic/schedule/month-view";
import { LessonEditModal } from "@/components/academic/schedule/lesson-edit-modal";
import { LessonModal } from "@/components/academic/schedule/lesson-modal";
import { SubstituteModal } from "@/components/academic/schedule/substitute-modal";
import { AutogenerateWizard } from "@/components/academic/schedule/autogenerate-wizard";
import { ConflictsDrawer } from "@/components/academic/schedule/conflicts-drawer";
import { HistoryDrawer } from "@/components/academic/schedule/history-drawer";
import { useCan } from "@/lib/auth/use-can";

type Tab = "primary" | "high" | "teacher";
type ViewMode = "quarter" | "month" | "template";

interface CellTarget {
  weekday: number;
  periodId: string;
  cell?: LessonCell | null;
}

export default function SchedulePage() {
  const { t } = useI18n();
  const can = useCan();
  // Tahrir amallari (avtogeneratsiya, qo'shish, o'chirish) faqat ruxsat bo'lsa.
  const canManage =
    can("lms-lessons.create") || can("lms-lessons.update") || can("lms-lessons.delete");

  // ---- URL bilan sinxron holat (yangilash/ulashishda saqlanadi) ----
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: quarters } = useQuarters();
  const [quarterId, setQuarterId] = useState(() => searchParams.get("quarterId") ?? "");
  useEffect(() => {
    if (!quarterId && quarters && quarters.length) {
      const current = quarters.find((q) => q.status === "current") ?? quarters[0];
      setQuarterId(current.id);
    }
  }, [quarters, quarterId]);

  const [tab, setTab] = useState<Tab>(() => (searchParams.get("tab") as Tab) || "primary");
  const [view, setView] = useState<ViewMode>(() => (searchParams.get("view") as ViewMode) || "quarter");
  const [classId, setClassId] = useState(() => searchParams.get("classId") ?? "");
  const [teacherId, setTeacherId] = useState(() => searchParams.get("teacherId") ?? "");
  const [dayFilter, setDayFilter] = useState<"all" | number>("all");

  const { data: classes } = useScheduleClasses(quarterId);
  const { data: subjects } = useSubjects();
  const { data: rooms } = useRooms();
  const { data: teachers } = useScheduleTeachers();
  const { data: courses } = useCourseList({ limit: 200 });

  const classGrid = useScheduleGrid(quarterId, tab !== "teacher" ? classId : undefined);
  const teacherGrid = useTeacherGrid(quarterId, tab === "teacher" ? teacherId : undefined);
  const grid = tab === "teacher" ? teacherGrid : classGrid;

  const quarterView = useQuarterView(
    view === "quarter" || view === "month" ? quarterId : undefined,
    tab === "teacher" ? { teacherId } : { classId },
  );

  const deleteCell = useDeleteCell();

  const [lessonTarget, setLessonTarget] = useState<CellTarget | null>(null);
  const [editTarget, setEditTarget] = useState<{ cell: QuarterCell; periodId: string } | null>(null);
  const [substituteTarget, setSubstituteTarget] = useState<CellTarget | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  // -------- Options --------
  const quarterOptions: SelectOption[] = useMemo(
    () =>
      (quarters ?? []).map((q) => ({
        value: q.id,
        label: loc(q.name) || `${q.quarterNumber}-chorak`,
      })),
    [quarters],
  );
  const classList = tab === "primary" ? classes?.primary : classes?.high;
  const classOptions: SelectOption[] = useMemo(
    () => (classList ?? []).map((c) => ({ value: c.id, label: c.name })),
    [classList],
  );
  const allClassOptions: SelectOption[] = useMemo(
    () =>
      [...(classes?.primary ?? []), ...(classes?.high ?? [])].map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [classes],
  );
  const teacherOptions: SelectOption[] = useMemo(
    () => (teachers?.items ?? []).map((u) => ({ value: u.id, label: u.fullName })),
    [teachers],
  );
  const subjectOptions: SelectOption[] = useMemo(
    () => (subjects ?? []).map((s) => ({ value: s.id, label: s.name })),
    [subjects],
  );
  const roomOptions: SelectOption[] = useMemo(
    () => (rooms?.items ?? []).map((r) => ({ value: r.id, label: r.roomNumber })),
    [rooms],
  );
  const courseOptions: SelectOption[] = useMemo(
    () => (courses?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
    [courses],
  );

  // Tab almashganda tanlovni tozalash — birinchi render (URL'dan kelgan tanlov) saqlanadi.
  const firstTabRun = useRef(true);
  useEffect(() => {
    if (firstTabRun.current) {
      firstTabRun.current = false;
      return;
    }
    setClassId("");
    setTeacherId("");
  }, [tab]);

  // Holatni URL query'ga yozish.
  useEffect(() => {
    const params = new URLSearchParams();
    if (quarterId) params.set("quarterId", quarterId);
    params.set("view", view);
    params.set("tab", tab);
    if (tab === "teacher") {
      if (teacherId) params.set("teacherId", teacherId);
    } else if (classId) {
      params.set("classId", classId);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [quarterId, view, tab, classId, teacherId, pathname, router]);

  // Ko'rinishlar: "template" (shablon tahrirlash) faqat boshqaruv ruxsati bo'lsa.
  const viewModes: ViewMode[] = canManage
    ? ["quarter", "month", "template"]
    : ["quarter", "month"];
  useEffect(() => {
    if (view === "template" && !canManage) setView("quarter");
  }, [view, canManage]);

  const days = grid.data?.days ?? [1, 2, 3, 4, 5];
  const filteredDays = visibleDays(days, dayFilter);
  const currentClassName = classOptions.find((c) => c.value === classId)?.label ?? "";

  // -------- Excel eksport --------
  const isTemplateView = view === "template";
  const canExport = isTemplateView ? Boolean(grid.data) : Boolean(quarterView.data);

  const handleExport = () => {
    const targetName =
      tab === "teacher"
        ? teacherOptions.find((o) => o.value === teacherId)?.label ?? ""
        : currentClassName;
    const quarterName = quarterOptions.find((q) => q.value === quarterId)?.label ?? "";

    const labels: ScheduleExportLabels = {
      title: [targetName, quarterName].filter(Boolean).join(" · "),
      gridSheet: isTemplateView ? t("sched.view.template") : t("sched.exp.sheetGrid"),
      listSheet: t("sched.exp.sheetList"),
      week: (n) => t("sched.weekN").replace("{n}", String(n)),
      day: (d) => t(`sched.day.${d}`),
      period: t("sched.exp.period"),
      date: t("sched.exp.date"),
      weekCol: t("sched.exp.week"),
      dayCol: t("sched.exp.day"),
      start: t("sched.exp.start"),
      end: t("sched.exp.end"),
      subject: t("sched.exp.subject"),
      teacher: t("sched.exp.teacher"),
      className: t("sched.exp.class"),
      room: t("sched.exp.room"),
      substituted: t("sched.exp.substituted"),
      yes: t("sched.exp.yes"),
    };

    // Ekranda ko'ringan kunlar eksport qilinadi (kun filtri ham hisobga olinadi).
    const opts = {
      days: filteredDays,
      mode: (tab === "teacher" ? "teacher" : "class") as "class" | "teacher",
      labels,
      localize: loc,
    };

    const sheets = isTemplateView
      ? grid.data && buildTemplateWorkbook(grid.data, opts)
      : quarterView.data && buildQuarterWorkbook(quarterView.data, opts);
    if (!sheets) return;

    downloadXlsx(safeFileName([t("sched.exp.sheetGrid"), targetName, quarterName]), sheets);
    showToast(t("sched.exp.done"));
  };

  const handleDelete = (cell: LessonCell) => {
    if (window.confirm(`${t("sched.menu.delete")}?`)) {
      deleteCell.mutate(cell.id, {
        onSuccess: (r) => showToast(`${r.deleted} ${t("sched.wz.unit.lesson")}`),
      });
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "primary", label: t("sched.tab.primary") },
    { key: "high", label: t("sched.tab.high") },
    { key: "teacher", label: t("sched.tab.byTeacher") },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-print w-44">
          <Select
            options={quarterOptions}
            placeholder="Chorak"
            value={quarterId}
            onChange={(e) => setQuarterId(e.target.value)}
          />
        </div>
        <div className="no-print flex flex-wrap gap-2">
          {canManage && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)} disabled={!quarterId}>
                <History className="h-4 w-4" /> {t("sched.history")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setWizardOpen(true)} disabled={!quarterId}>
                <Sparkles className="h-4 w-4" /> {t("sched.autogenerate")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConflictsOpen(true)} disabled={!quarterId}>
                <AlertTriangle className="h-4 w-4" /> {t("sched.conflicts")}
              </Button>
            </>
          )}
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={!canExport}>
            <FileSpreadsheet className="h-4 w-4" /> {t("sched.export")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> {t("sched.print")}
          </Button>
        </div>
      </div>

      {/* Tabs + day filter */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-line p-1">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === tabItem.key ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-parchment",
              )}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <DayChip active={dayFilter === "all"} onClick={() => setDayFilter("all")} label={t("sched.allDays")} />
          {(grid.data?.days ?? [1, 2, 3, 4, 5]).map((d) => (
            <DayChip
              key={d}
              active={dayFilter === d}
              onClick={() => setDayFilter(d)}
              label={t(`sched.day.${d}`).slice(0, 2)}
            />
          ))}
        </div>
      </div>

      {/* Class / teacher selector + view switcher */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="w-72">
          {tab === "teacher" ? (
            <Select
              options={teacherOptions}
              placeholder={t("sched.selectTeacher")}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            />
          ) : (
            <Select
              options={classOptions}
              placeholder={t("sched.selectClass")}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
          )}
        </div>
        <div className="flex gap-1 rounded-lg border border-line p-1">
          {viewModes.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-parchment",
              )}
            >
              {t(`sched.view.${v}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="print-area space-y-4">
      {tab !== "teacher" && !classId ? (
        <EmptyState text={t("sched.chooseClassHint")} />
      ) : tab === "teacher" && !teacherId ? (
        <EmptyState text={t("sched.chooseTeacherHint")} />
      ) : view === "quarter" || view === "month" ? (
        quarterView.isLoading ? (
          <ScheduleSkeleton />
        ) : quarterView.data ? (
          view === "month" ? (
            <MonthViewGrid
              view={quarterView.data}
              mode={tab === "teacher" ? "teacher" : "class"}
              onEditCell={canManage ? (cell, periodId) => setEditTarget({ cell, periodId }) : undefined}
            />
          ) : (
            <QuarterViewGrid
              view={quarterView.data}
              days={filteredDays}
              mode={tab === "teacher" ? "teacher" : "class"}
              onEditCell={canManage ? (cell, periodId) => setEditTarget({ cell, periodId }) : undefined}
            />
          )
        ) : null
      ) : grid.isLoading ? (
        <ScheduleSkeleton />
      ) : grid.data ? (
        <ScheduleGridView
          grid={grid.data}
          days={filteredDays}
          mode={tab === "teacher" ? "teacher" : "class"}
          readOnly={!canManage}
          onAdd={(weekday, periodId) => setLessonTarget({ weekday, periodId, cell: null })}
          onEdit={(cell, weekday, periodId) => setLessonTarget({ weekday, periodId, cell })}
          onSubstitute={(cell, weekday, periodId) => setSubstituteTarget({ weekday, periodId, cell })}
          onDelete={(cell) => handleDelete(cell)}
        />
      ) : null}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-positive/30 bg-surface px-4 py-2.5 text-sm text-ink shadow-card"
        >
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}

      {/* Modals */}
      {editTarget && quarterView.data && (
        <LessonEditModal
          open
          onClose={() => setEditTarget(null)}
          quarterId={quarterId}
          cell={editTarget.cell}
          periodId={editTarget.periodId}
          periodLabel={quarterView.data.periods.find((p) => p.id === editTarget.periodId)?.code ?? ""}
          currentClassName={editTarget.cell.className ?? currentClassName}
          subjects={subjectOptions}
          teachers={teacherOptions}
          rooms={roomOptions}
          classes={allClassOptions}
          onDone={() => showToast(t("sched.common.update"))}
        />
      )}

      {lessonTarget && classId && (
        <LessonModal
          open
          onClose={() => setLessonTarget(null)}
          quarterId={quarterId}
          classId={classId}
          weekday={lessonTarget.weekday}
          periodId={lessonTarget.periodId}
          periodLabel={grid.data?.periods.find((p) => p.id === lessonTarget.periodId)?.code ?? ""}
          className={currentClassName}
          cell={lessonTarget.cell}
          subjects={subjectOptions}
          teachers={teacherOptions}
          rooms={roomOptions}
          courses={courseOptions}
          onDone={() => showToast(t("sched.lm.create"))}
        />
      )}

      {substituteTarget?.cell && classId && (
        <SubstituteModal
          open
          onClose={() => setSubstituteTarget(null)}
          quarterId={quarterId}
          classId={classId}
          weekday={substituteTarget.weekday}
          periodId={substituteTarget.periodId}
          cell={substituteTarget.cell}
          teachers={teacherOptions}
          onDone={(n) => showToast(`${n} ${t("sched.wz.unit.lesson")}`)}
        />
      )}

      {wizardOpen && quarterId && (
        <AutogenerateWizard
          open
          onClose={() => setWizardOpen(false)}
          quarterId={quarterId}
          classes={allClassOptions}
          subjects={subjectOptions}
          teachers={teacherOptions}
          onDone={(created) =>
            showToast(`${created} ${t("sched.wz.unit.lesson")} ${t("sched.toast.created")}`)
          }
        />
      )}

      {conflictsOpen && quarterId && (
        <ConflictsDrawer open onClose={() => setConflictsOpen(false)} quarterId={quarterId} />
      )}
      {historyOpen && quarterId && (
        <HistoryDrawer
          open
          onClose={() => setHistoryOpen(false)}
          quarterId={quarterId}
          classId={tab !== "teacher" ? classId || undefined : undefined}
        />
      )}
    </div>
  );
}

function DayChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-parchment",
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-20 text-center">
      <p className="text-sm text-ink-muted">{text}</p>
    </div>
  );
}

/** Jadval yuklanayotganda tuzilma ko'rinadigan skeleton (spinner o'rniga). */
function ScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <div className="h-4 w-4 animate-pulse rounded bg-line" />
            <div className="h-4 w-24 animate-pulse rounded bg-line" />
            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-line" />
          </div>
          {i === 0 && (
            <div className="grid grid-cols-6 gap-px bg-line p-px">
              {Array.from({ length: 18 }).map((_, j) => (
                <div key={j} className="h-14 animate-pulse bg-surface" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
