"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import {
  GRADE_REQUEST_KIND_LABELS,
  useCreateGradeRequest,
  useUpdateGradeRequest,
  type GradeRequest,
  type GradeRequestKind,
} from "@/lib/api/grade-requests";
import { fullName, useStudents } from "@/lib/api/students";
import { useSubjectList } from "@/lib/api/subjects";
import { useQuarters } from "@/lib/api/quarters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

interface Props {
  open: boolean;
  kind: GradeRequestKind;
  editing: GradeRequest | null;
  onClose: () => void;
}

/** Baho o'zgartirish so'rovini yaratish/tahrirlash modali. */
export function GradeRequestFormModal({ open, kind, editing, onClose }: Props) {
  const isEdit = Boolean(editing);
  const effectiveKind = editing?.kind ?? kind;

  const [studentId, setStudentId] = useState(editing?.studentId ?? "");
  const [subjectId, setSubjectId] = useState(editing?.subjectId ?? "");
  const [quarterId, setQuarterId] = useState(editing?.quarterId ?? "");
  const [currentGrade, setCurrentGrade] = useState(
    editing?.currentGrade != null ? String(editing.currentGrade) : "",
  );
  const [requestedGrade, setRequestedGrade] = useState(
    editing?.requestedGrade != null ? String(editing.requestedGrade) : "",
  );
  const [reason, setReason] = useState(editing?.reason ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: studentsPage } = useStudents({ limit: 100 });
  const { data: subjectData } = useSubjectList();
  const { data: quarterData } = useQuarters();
  const create = useCreateGradeRequest();
  const update = useUpdateGradeRequest();

  useEffect(() => {
    if (editing) {
      setStudentId(editing.studentId);
      setSubjectId(editing.subjectId ?? "");
      setQuarterId(editing.quarterId ?? "");
      setCurrentGrade(editing.currentGrade != null ? String(editing.currentGrade) : "");
      setRequestedGrade(editing.requestedGrade != null ? String(editing.requestedGrade) : "");
      setReason(editing.reason);
    }
  }, [editing]);

  const studentOptions = useMemo(() => {
    const items = studentsPage?.items ?? [];
    return [
      { value: "", label: "O‘quvchini tanlang" },
      ...items.map((s) => ({ value: s.id, label: fullName(s) })),
    ];
  }, [studentsPage]);

  const subjectOptions = useMemo(() => {
    const items = subjectData?.items ?? [];
    return [
      { value: "", label: "Fanni tanlang" },
      ...items.map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [subjectData]);

  const quarterOptions = useMemo(() => {
    const items = quarterData?.items ?? [];
    return [
      { value: "", label: "Chorakni tanlang" },
      ...items.map((q) => ({ value: q.id, label: q.name })),
    ];
  }, [quarterData]);

  const pending = create.isPending || update.isPending;

  async function submit() {
    setError(null);
    const grade = Number(requestedGrade);
    if (!isEdit && !studentId) {
      setError("O‘quvchini tanlang");
      return;
    }
    if (!requestedGrade || Number.isNaN(grade) || grade < 0 || grade > 100) {
      setError("Yangi baho 0–100 oralig‘ida bo‘lishi kerak");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Sabab kamida 3 belgidan iborat bo‘lishi kerak");
      return;
    }
    if (effectiveKind === "quarter" && !quarterId) {
      setError("Choraklik baho uchun chorakni tanlang");
      return;
    }

    const cg = currentGrade.trim() === "" ? undefined : Number(currentGrade);

    try {
      if (isEdit && editing) {
        await update.mutateAsync({
          id: editing.id,
          input: {
            subjectId: subjectId || undefined,
            quarterId: quarterId || undefined,
            currentGrade: cg,
            requestedGrade: grade,
            reason: reason.trim(),
          },
        });
      } else {
        await create.mutateAsync({
          kind: effectiveKind,
          studentId,
          subjectId: subjectId || undefined,
          quarterId: quarterId || undefined,
          currentGrade: cg,
          requestedGrade: grade,
          reason: reason.trim(),
        });
      }
      onClose();
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "So‘rovni tahrirlash" : "Baho o‘zgartirish so‘rovi"}
      subtitle={GRADE_REQUEST_KIND_LABELS[effectiveKind]}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button loading={pending} onClick={submit}>
            <Save className="h-4 w-4" /> Saqlash
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label mb-1 block">O‘quvchi</label>
          <Select
            options={studentOptions}
            value={studentId}
            disabled={isEdit}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>

        <div>
          <label className="label mb-1 block">Fan</label>
          <Select options={subjectOptions} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
        </div>

        {effectiveKind === "quarter" && (
          <div>
            <label className="label mb-1 block">Chorak</label>
            <Select options={quarterOptions} value={quarterId} onChange={(e) => setQuarterId(e.target.value)} />
          </div>
        )}

        <div>
          <label className="label mb-1 block">Joriy baho</label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={currentGrade}
            onChange={(e) => setCurrentGrade(e.target.value)}
            placeholder="Masalan: 3"
          />
        </div>

        <div>
          <label className="label mb-1 block">Yangi baho</label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={requestedGrade}
            onChange={(e) => setRequestedGrade(e.target.value)}
            placeholder="Masalan: 5"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label mb-1 block">So‘rov sababi</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Baho nima uchun o‘zgartirilishi kerakligini yozing"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </div>

        {error && <p className="sm:col-span-2 text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}
