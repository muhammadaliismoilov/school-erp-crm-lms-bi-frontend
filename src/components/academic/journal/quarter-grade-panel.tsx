"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GradebookStudent, QuarterGradeInput } from "@/lib/api/gradebook";

interface Props {
  open: boolean;
  onClose: () => void;
  student: GradebookStudent;
  subjectId: string;
  quarterId: string;
  saving: boolean;
  onSave: (input: QuarterGradeInput) => void;
}

export function QuarterGradePanel({ open, onClose, student, subjectId, quarterId, saving, onSave }: Props) {
  const [grade, setGrade] = useState<number | null>(null);
  const [ball, setBall] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    setGrade(student.quarterGrade ?? null);
    setBall(student.quarterBall != null ? String(student.quarterBall) : "");
    setComment(student.quarterComment ?? "");
  }, [open, student]);

  const save = () => {
    onSave({
      studentId: student.id,
      subjectId,
      quarterId,
      grade,
      ball: ball.trim() === "" ? null : Math.max(0, Math.min(100, Number(ball))),
      comment,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student.fullName}
      subtitle="Choraklik yakuniy baho"
      size="md"
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
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Choraklik baho</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((g) => (
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
          </div>
        </div>
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
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Xulosa</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Xulosa kiriting…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
          />
        </div>
      </div>
    </Modal>
  );
}
