"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import {
  attendanceTone,
  type AttendanceStatus,
  type CoinPreset,
  type GradebookCell,
  type UpsertGradeInput,
  type AwardCoinInput,
} from "@/lib/api/gradebook";

interface Props {
  open: boolean;
  onClose: () => void;
  lesson: { id: string; lessonDate: string };
  student: { id: string; fullName: string };
  cell?: GradebookCell;
  presets: CoinPreset[];
  saving: boolean;
  onSave: (input: UpsertGradeInput) => void;
  onAward: (input: AwardCoinInput) => void;
}

const ATT: { key: AttendanceStatus; label: string }[] = [
  { key: "present", label: "Kelgan" },
  { key: "absent", label: "Kelmagan" },
  { key: "late", label: "Kechikkan" },
];

export function CellEditor({ open, onClose, lesson, student, cell, presets, saving, onSave, onAward }: Props) {
  const [grade, setGrade] = useState<number | null>(null);
  const [ball, setBall] = useState("");
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    setGrade(cell?.grade ?? null);
    setBall(cell?.ball != null ? String(cell.ball) : "");
    setAttendance(cell?.attendance ?? null);
    setComment(cell?.comment ?? "");
  }, [open, cell]);

  const save = () => {
    onSave({
      lessonId: lesson.id,
      studentId: student.id,
      grade,
      ball: ball.trim() === "" ? null : Math.max(0, Math.min(100, Number(ball))),
      attendance,
      comment,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student.fullName}
      subtitle={formatDate(lesson.lessonDate)}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button variant="accent" onClick={save} loading={saving}>
            Saqlash
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Baho */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Baho</label>
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(grade === g ? null : g)}
                className={cn(
                  "h-10 w-10 rounded-lg border text-sm font-semibold transition-colors",
                  grade === g ? "border-accent bg-accent text-accent-fg" : "border-line text-ink hover:bg-parchment",
                )}
              >
                {g}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGrade(null)}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-parchment hover:text-negative"
              aria-label="Bahoni o‘chirish"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ball */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Ball (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={ball}
            onChange={(e) => setBall(e.target.value)}
            placeholder="—"
            className="h-10 w-28 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
          />
        </div>

        {/* Davomat */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Davomat</label>
          <div className="grid grid-cols-3 gap-2">
            {ATT.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setAttendance(attendance === a.key ? null : a.key)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm transition-colors",
                  attendance === a.key ? "border-accent bg-accent/10 text-ink" : "border-line text-ink-soft hover:bg-parchment",
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", attendanceTone(a.key))} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Izoh */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Izoh</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Izoh kiriting…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
          />
        </div>

        {/* Tanga */}
        {presets.length > 0 && (
          <div className="rounded-lg border border-line p-3">
            <p className="mb-2 text-xs font-medium text-ink-muted">Tanga (berish / ayrish)</p>
            <div className="space-y-2">
              {presets.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color ?? "#94a3b8" }} />
                    {p.name} · {p.amount.toLocaleString("ru-RU").replace(/,/g, " ")}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onAward({ studentId: student.id, type: "earn", amount: p.amount, reason: p.name, lessonId: lesson.id })}
                      className="rounded-md border border-positive/40 px-2 py-1 text-xs font-medium text-positive hover:bg-positive/10"
                    >
                      + Berish
                    </button>
                    <button
                      type="button"
                      onClick={() => onAward({ studentId: student.id, type: "spend", amount: p.amount, reason: p.name, lessonId: lesson.id })}
                      className="rounded-md border border-negative/40 px-2 py-1 text-xs font-medium text-negative hover:bg-negative/10"
                    >
                      − Ayrish
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
