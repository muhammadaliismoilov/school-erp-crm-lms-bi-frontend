"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn, loc } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { ApiError } from "@/lib/api/types";
import {
  useCellAvailability,
  useUpdateCell,
  type EditScope,
  type QuarterCell,
  type ScheduleConflictDetail,
} from "@/lib/api/schedule";

interface Props {
  open: boolean;
  onClose: () => void;
  quarterId: string;
  cell: QuarterCell;
  periodId: string;
  periodLabel: string;
  currentClassName: string;
  subjects: SelectOption[];
  teachers: SelectOption[];
  rooms: SelectOption[];
  classes: SelectOption[];
  onDone: () => void;
}

/** Sana formatlash: "07.09.2026". */
function fmtDate(d: string): string {
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
}

export function LessonEditModal({
  open,
  onClose,
  quarterId,
  cell,
  periodId,
  periodLabel,
  currentClassName,
  subjects,
  teachers,
  rooms,
  classes,
  onDone,
}: Props) {
  const { t } = useI18n();
  const update = useUpdateCell();

  const [scope, setScope] = useState<EditScope>("single");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflictDetail[]>([]);

  useEffect(() => {
    if (!open) return;
    setScope("single");
    setSubjectId(cell.subjectId ?? "");
    setTeacherId(cell.teacherId ?? "");
    setRoomId(cell.roomId ?? "");
    setClassId(cell.classId ?? "");
    setError(null);
    setConflicts([]);
  }, [open, cell]);

  // Aynan shu sana + parada band identifikatorlar (o'zini hisobga olmay).
  const { data: avail } = useCellAvailability(quarterId, cell.lessonDate, periodId, cell.id);
  const busyT = useMemo(() => new Set(avail?.busyTeacherIds ?? []), [avail]);
  const busyR = useMemo(() => new Set(avail?.busyRoomIds ?? []), [avail]);
  const busyC = useMemo(() => new Set(avail?.busyClassIds ?? []), [avail]);

  // Band variantlarni " · band" bilan belgilaymiz.
  const markBusy = useCallback(
    (opts: SelectOption[], busy: Set<string>): SelectOption[] =>
      opts.map((o) => (busy.has(o.value) ? { ...o, label: `${o.label} · ${t("sched.busy")}` } : o)),
    [t],
  );

  const teacherOpts = useMemo(() => markBusy(teachers, busyT), [markBusy, teachers, busyT]);
  const roomOpts = useMemo(() => markBusy(rooms, busyR), [markBusy, rooms, busyR]);
  const classOpts = useMemo(() => markBusy(classes, busyC), [markBusy, classes, busyC]);

  const teacherBusy = Boolean(teacherId) && busyT.has(teacherId);
  const roomBusy = Boolean(roomId) && busyR.has(roomId);
  const classChanged = classId !== cell.classId;
  const classBusy = classChanged && busyC.has(classId);
  const blocked = teacherBusy || roomBusy || classBusy;

  const submit = async () => {
    setError(null);
    setConflicts([]);
    if (!subjectId) return setError(t("sched.err.subject"));
    if (blocked) return setError(t("sched.edit.blockedHint"));
    try {
      await update.mutateAsync({
        id: cell.id,
        body: {
          subjectId,
          teacherId: teacherId || undefined,
          roomId: roomId || undefined,
          ...(classChanged ? { classId } : {}),
          scope,
        },
      });
      onDone();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === "SCHEDULE_CONFLICT") {
        const details = Array.isArray(err.details) ? (err.details as ScheduleConflictDetail[]) : [];
        setConflicts(details);
        setError(t("sched.edit.conflictErr"));
      } else {
        setError(err instanceof ApiError ? err.message : t("common.error"));
      }
    }
  };

  const scopeOptions: { key: EditScope; label: string; hint: string }[] = [
    { key: "single", label: t("sched.scope.single"), hint: fmtDate(cell.lessonDate) },
    { key: "future", label: t("sched.scope.future"), hint: t("sched.scope.futureHint") },
    { key: "all", label: t("sched.scope.all"), hint: t("sched.scope.allHint") },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("sched.edit.title")}
      subtitle={`${currentClassName} · ${fmtDate(cell.lessonDate)} · ${periodLabel} · ${loc(cell.subjectName)}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            {t("sched.common.cancel")}
          </Button>
          <Button variant="accent" onClick={submit} loading={update.isPending} disabled={blocked}>
            {t("sched.common.update")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Qamrov */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">{t("sched.edit.scope")}</label>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {scopeOptions.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScope(s.key)}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-colors",
                  scope === s.key
                    ? "border-accent bg-accent/10"
                    : "border-line hover:bg-parchment",
                )}
              >
                <p className="text-sm font-medium text-ink">{s.label}</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">{s.hint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Maydonlar */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.lm.subject")}</label>
            <Select
              options={subjects}
              placeholder={t("sched.lm.subject")}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.lm.teacher")}</label>
            <Select
              options={teacherOpts}
              placeholder={t("sched.lm.teacher")}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={cn(teacherBusy && "border-negative")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.lm.room")}</label>
            <Select
              options={roomOpts}
              placeholder={t("sched.lm.room")}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={cn(roomBusy && "border-negative")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.edit.moveClass")}</label>
            <Select
              options={classOpts}
              placeholder={t("sched.edit.moveClass")}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className={cn(classBusy && "border-negative")}
            />
          </div>
        </div>

        {/* Band ogohlantirishi (tanlangan sana uchun) */}
        {blocked && (
          <div className="flex items-start gap-2 rounded-lg border border-negative/30 bg-negative/5 p-3 text-sm text-negative">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("sched.edit.blockedHint")}</span>
          </div>
        )}

        {/* Server konflikti (boshqa sanalarda ham band bo'lishi mumkin) */}
        {conflicts.length > 0 && (
          <div className="rounded-lg border border-negative/30 bg-negative/5 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-negative">
              <AlertTriangle className="h-4 w-4" /> {t("sched.edit.conflictErr")}
            </p>
            <ul className="space-y-0.5 text-xs text-ink-soft">
              {conflicts.slice(0, 8).map((c, i) => (
                <li key={i}>
                  {fmtDate(c.date)} — {t(`sched.cf.${c.type}`)}: {c.entityName ?? "—"}
                  {c.className ? ` (${c.className})` : ""}
                </li>
              ))}
              {conflicts.length > 8 && <li>+{conflicts.length - 8}…</li>}
            </ul>
          </div>
        )}

        {error && !blocked && conflicts.length === 0 && (
          <p className="text-sm text-negative">{error}</p>
        )}
      </div>
    </Modal>
  );
}
