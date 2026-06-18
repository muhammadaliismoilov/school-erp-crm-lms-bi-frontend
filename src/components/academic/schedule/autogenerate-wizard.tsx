"use client";

import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn, loc } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { ApiError } from "@/lib/api/types";
import {
  previewSchedule,
  useGenerateSchedule,
  type GenerateMode,
  type PreviewResult,
} from "@/lib/api/schedule";

interface Row {
  classId: string;
  subjectId: string;
  teacherId: string;
  hoursPerWeek: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  quarterId: string;
  classes: SelectOption[];
  subjects: SelectOption[];
  teachers: SelectOption[];
  onDone: (created: number) => void;
}

const DAY_KEYS = [1, 2, 3, 4, 5, 6, 7];

export function AutogenerateWizard({
  open,
  onClose,
  quarterId,
  classes,
  subjects,
  teachers,
  onDone,
}: Props) {
  const { t } = useI18n();
  const generate = useGenerateSchedule();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<GenerateMode>("add");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [maxPerDay, setMaxPerDay] = useState(7);
  const [maxPerSubject, setMaxPerSubject] = useState(2);
  const [rows, setRows] = useState<Row[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setMode("add");
      setDays([1, 2, 3, 4, 5]);
      setMaxPerDay(7);
      setMaxPerSubject(2);
      setRows([]);
      setPreview(null);
      setError(null);
    }
  }, [open]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const validRows = rows.filter((r) => r.classId && r.subjectId && r.hoursPerWeek > 0);

  const buildPayload = () => ({
    quarterId,
    mode,
    days,
    maxPerDay,
    maxPerSubjectPerDay: maxPerSubject,
    distribution: validRows.map((r) => ({
      classId: r.classId,
      subjectId: r.subjectId,
      teacherId: r.teacherId || undefined,
      hoursPerWeek: r.hoursPerWeek,
    })),
  });

  const goConfirm = async () => {
    setError(null);
    setStep(3);
    setLoadingPreview(true);
    try {
      setPreview(await previewSchedule(buildPayload()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setLoadingPreview(false);
    }
  };

  const runGenerate = async () => {
    setError(null);
    try {
      const res = await generate.mutateAsync(buildPayload());
      onDone(res.created);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    }
  };

  const steps = [t("sched.wz.step1"), t("sched.wz.step2"), t("sched.wz.step3")];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("sched.wz.title")}
      subtitle={t("sched.wz.subtitle")}
      footer={
        <div className="flex items-center justify-between gap-2">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={generate.isPending}>
                ← {t("sched.common.back")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={generate.isPending}>
              {t("sched.common.cancel")}
            </Button>
            {step === 1 && (
              <Button variant="accent" onClick={() => setStep(2)} disabled={days.length === 0}>
                {t("sched.common.next")} →
              </Button>
            )}
            {step === 2 && (
              <Button variant="accent" onClick={goConfirm} disabled={validRows.length === 0}>
                {t("sched.common.next")} →
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="accent"
                onClick={runGenerate}
                loading={generate.isPending}
                disabled={!preview?.valid || loadingPreview}
              >
                {t("sched.wz.createBtn")}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Steps indicator */}
      <div className="mb-6 flex items-center">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                    active && "bg-accent text-accent-fg",
                    done && "bg-positive text-white",
                    !active && !done && "bg-parchment text-ink-muted",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</span>
              </div>
              {n < steps.length && (
                <div className={cn("mx-2 h-0.5 flex-1", step > n ? "bg-positive" : "bg-line")} />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mb-3 text-sm text-negative">{error}</p>}

      {/* Step 1 — settings */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.wz.mode")}</label>
            <div className="grid grid-cols-2 gap-2">
              {(["add", "refresh"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    mode === m ? "border-accent bg-accent/10 text-ink" : "border-line text-ink-soft hover:bg-parchment",
                  )}
                >
                  {m === "add" ? t("sched.wz.modeAdd") : t("sched.wz.modeRefresh")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.wz.days")}</label>
            <div className="flex flex-wrap gap-2">
              {DAY_KEYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    days.includes(d)
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line text-ink-soft hover:bg-parchment",
                  )}
                >
                  {t(`sched.day.${d}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.wz.maxPerDay")}</label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.wz.maxPerSubject")}</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxPerSubject}
                onChange={(e) => setMaxPerSubject(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — distribution */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_72px_32px] gap-2 px-1 text-[11px] uppercase tracking-wide text-ink-muted">
            <span>{t("sched.wz.class")}</span>
            <span>{t("sched.lm.subject")}</span>
            <span>{t("sched.lm.teacher")}</span>
            <span>{t("sched.wz.hours")}</span>
            <span />
          </div>
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_72px_32px] items-center gap-2">
              <Select
                options={classes}
                placeholder={t("sched.wz.class")}
                value={row.classId}
                onChange={(e) => setRows((r) => r.map((x, i) => (i === idx ? { ...x, classId: e.target.value } : x)))}
              />
              <Select
                options={subjects}
                placeholder={t("sched.lm.subject")}
                value={row.subjectId}
                onChange={(e) => setRows((r) => r.map((x, i) => (i === idx ? { ...x, subjectId: e.target.value } : x)))}
              />
              <Select
                options={teachers}
                placeholder={t("sched.lm.teacher")}
                value={row.teacherId}
                onChange={(e) => setRows((r) => r.map((x, i) => (i === idx ? { ...x, teacherId: e.target.value } : x)))}
              />
              <input
                type="number"
                min={1}
                max={40}
                value={row.hoursPerWeek}
                onChange={(e) =>
                  setRows((r) => r.map((x, i) => (i === idx ? { ...x, hoursPerWeek: Number(e.target.value) } : x)))
                }
                className="h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              />
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}
                className="flex h-10 items-center justify-center rounded-lg text-ink-muted hover:bg-parchment hover:text-negative"
                aria-label={t("sched.menu.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows((r) => [...r, { classId: "", subjectId: "", teacherId: "", hoursPerWeek: 2 }])}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-sm text-ink-soft hover:bg-parchment"
          >
            <Plus className="h-4 w-4" /> {t("sched.wz.addRow")}
          </button>
        </div>
      )}

      {/* Step 3 — confirm */}
      {step === 3 && (
        <div className="space-y-4">
          {loadingPreview && <p className="text-sm text-ink-muted">…</p>}
          {preview && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label={t("sched.wz.card.days")} value={`${preview.days} ${t("sched.wz.unit.day")}`} />
                <SummaryCard label={t("sched.wz.card.maxDaily")} value={`${preview.maxPerDay} ${t("sched.wz.unit.lesson")}`} />
                <SummaryCard
                  label={t("sched.wz.card.toAdd")}
                  value={`${preview.toCreate} ${t("sched.wz.unit.subject")}`}
                  tone="positive"
                />
                <SummaryCard
                  label={t("sched.wz.card.toUpdate")}
                  value={`${preview.toUpdate} ${t("sched.wz.unit.subject")}`}
                  tone="negative"
                />
              </div>

              {!preview.valid && preview.message && (
                <p className="text-center text-sm text-negative">{preview.message}</p>
              )}

              {preview.distribution.length > 0 && (
                <div className="rounded-lg border border-line">
                  <p className="border-b border-line px-3 py-2 text-xs font-medium text-ink-muted">
                    {t("sched.wz.distribution")}
                  </p>
                  <ul className="max-h-56 divide-y divide-line overflow-auto">
                    {preview.distribution.map((d, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <span className="text-ink">
                          {d.className} — {loc(d.subjectName)}
                        </span>
                        <span className="flex items-center gap-2 text-ink-muted">
                          {d.teacherName ?? "—"}
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px]",
                              d.status === "add"
                                ? "bg-positive/10 text-positive"
                                : "bg-amber/10 text-amber",
                            )}
                          >
                            {d.status === "add" ? t("sched.wz.modeAdd") : t("sched.wz.modeRefresh")}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Sparkles className="hidden" aria-hidden />
    </Modal>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          !tone && "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}
