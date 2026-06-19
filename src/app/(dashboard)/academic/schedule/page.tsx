"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, History, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
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
  useDeleteCell,
  visibleDays,
  type LessonCell,
} from "@/lib/api/schedule";
import { ScheduleGridView } from "@/components/academic/schedule/grid";
import { LessonModal } from "@/components/academic/schedule/lesson-modal";
import { SubstituteModal } from "@/components/academic/schedule/substitute-modal";
import { AutogenerateWizard } from "@/components/academic/schedule/autogenerate-wizard";
import { ConflictsDrawer } from "@/components/academic/schedule/conflicts-drawer";
import { HistoryDrawer } from "@/components/academic/schedule/history-drawer";

type Tab = "primary" | "high" | "teacher";

interface CellTarget {
  weekday: number;
  periodId: string;
  cell?: LessonCell | null;
}

export default function SchedulePage() {
  const { t } = useI18n();

  const { data: quarters } = useQuarters();
  const [quarterId, setQuarterId] = useState("");
  useEffect(() => {
    if (!quarterId && quarters && quarters.length) {
      const current = quarters.find((q) => q.status === "current") ?? quarters[0];
      setQuarterId(current.id);
    }
  }, [quarters, quarterId]);

  const [tab, setTab] = useState<Tab>("primary");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayFilter, setDayFilter] = useState<"all" | number>("all");

  const { data: classes } = useScheduleClasses(quarterId);
  const { data: subjects } = useSubjects();
  const { data: rooms } = useRooms();
  const { data: teachers } = useScheduleTeachers();
  const { data: courses } = useCourseList({ limit: 200 });

  const classGrid = useScheduleGrid(quarterId, tab !== "teacher" ? classId : undefined);
  const teacherGrid = useTeacherGrid(quarterId, tab === "teacher" ? teacherId : undefined);
  const grid = tab === "teacher" ? teacherGrid : classGrid;

  const deleteCell = useDeleteCell();

  const [lessonTarget, setLessonTarget] = useState<CellTarget | null>(null);
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

  // Tab almashganda tanlovni tozalash.
  useEffect(() => {
    setClassId("");
    setTeacherId("");
  }, [tab]);

  const days = grid.data?.days ?? [1, 2, 3, 4, 5];
  const filteredDays = visibleDays(days, dayFilter);
  const currentClassName = classOptions.find((c) => c.value === classId)?.label ?? "";

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
        <div className="w-44">
          <Select
            options={quarterOptions}
            placeholder="Chorak"
            value={quarterId}
            onChange={(e) => setQuarterId(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)} disabled={!quarterId}>
            <History className="h-4 w-4" /> {t("sched.history")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWizardOpen(true)} disabled={!quarterId}>
            <Sparkles className="h-4 w-4" /> {t("sched.autogenerate")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConflictsOpen(true)} disabled={!quarterId}>
            <AlertTriangle className="h-4 w-4" /> {t("sched.conflicts")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> {t("sched.print")}
          </Button>
        </div>
      </div>

      {/* Tabs + day filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      {/* Class / teacher selector */}
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

      {/* Grid */}
      {tab !== "teacher" && !classId ? (
        <EmptyState text={t("sched.chooseClassHint")} />
      ) : tab === "teacher" && !teacherId ? (
        <EmptyState text={t("sched.chooseTeacherHint")} />
      ) : grid.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : grid.data ? (
        <ScheduleGridView
          grid={grid.data}
          days={filteredDays}
          mode={tab === "teacher" ? "teacher" : "class"}
          onAdd={(weekday, periodId) => setLessonTarget({ weekday, periodId, cell: null })}
          onEdit={(cell, weekday, periodId) => setLessonTarget({ weekday, periodId, cell })}
          onSubstitute={(cell, weekday, periodId) => setSubstituteTarget({ weekday, periodId, cell })}
          onDelete={(cell) => handleDelete(cell)}
        />
      ) : null}

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
