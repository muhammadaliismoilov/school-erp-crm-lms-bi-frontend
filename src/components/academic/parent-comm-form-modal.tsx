"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  COMM_SENTIMENTS,
  COMM_SENTIMENT_LABELS,
  PARENT_TYPES,
  PARENT_TYPE_LABELS,
  useCreateParentComm,
  useUpdateParentComm,
  type CommSentiment,
  type ParentComm,
  type ParentType,
} from "@/lib/api/parent-comms";
import { fullName, useStudent, useStudents } from "@/lib/api/students";
import { useClassList } from "@/lib/api/classes";
import { useUsers } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Props {
  open: boolean;
  editing: ParentComm | null;
  onClose: () => void;
}

const SECTION = "rounded-xl border border-line bg-parchment/30 p-4";
const SECTION_TITLE = "label mb-3 block uppercase tracking-wide text-ink-muted";

/** Ota-ona bilan muloqotni yaratish/tahrirlash drawer'i. */
export function ParentCommFormModal({ open, editing, onClose }: Props) {
  const isEdit = Boolean(editing);

  const [classId, setClassId] = useState(editing?.classId ?? "");
  const [studentId, setStudentId] = useState(editing?.studentId ?? "");
  const [parentId, setParentId] = useState(editing?.parentId ?? "");
  const [parentType, setParentType] = useState<ParentType | "">(editing?.parentType ?? "");
  const [sentiment, setSentiment] = useState<CommSentiment | "">(editing?.sentiment ?? "");
  const [tutorId, setTutorId] = useState(editing?.tutorId ?? "");
  const [educationScore, setEducationScore] = useState(num(editing?.educationScore));
  const [classLeaderScore, setClassLeaderScore] = useState(num(editing?.classLeaderScore));
  const [extracurricularScore, setExtracurricularScore] = useState(num(editing?.extracurricularScore));
  const [organizationalScore, setOrganizationalScore] = useState(num(editing?.organizationalScore));
  const [purpose, setPurpose] = useState(editing?.purpose ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: classData } = useClassList();
  const { data: studentsPage } = useStudents({ limit: 100, classId: classId || undefined });
  const { data: student } = useStudent(studentId || null);
  const { data: tutorsPage } = useUsers({ role: "TUTOR", limit: 100 });
  const create = useCreateParentComm();
  const update = useUpdateParentComm();

  useEffect(() => {
    if (editing) {
      setClassId(editing.classId ?? "");
      setStudentId(editing.studentId);
      setParentId(editing.parentId ?? "");
      setParentType(editing.parentType);
      setSentiment(editing.sentiment);
      setTutorId(editing.tutorId ?? "");
      setEducationScore(num(editing.educationScore));
      setClassLeaderScore(num(editing.classLeaderScore));
      setExtracurricularScore(num(editing.extracurricularScore));
      setOrganizationalScore(num(editing.organizationalScore));
      setPurpose(editing.purpose ?? "");
      setNotes(editing.notes ?? "");
    }
  }, [editing]);

  const classOptions = useMemo(() => {
    const items = classData?.items ?? [];
    return [
      { value: "", label: "Guruhni tanlang" },
      ...[...items]
        .sort((a, b) => a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section))
        .map((c) => ({ value: c.id, label: `${c.gradeLevel}-${c.section}` })),
    ];
  }, [classData]);

  const studentOptions = useMemo(() => {
    const items = studentsPage?.items ?? [];
    return [
      { value: "", label: "O‘quvchini tanlang" },
      ...items.map((s) => ({ value: s.id, label: fullName(s) })),
    ];
  }, [studentsPage]);

  const parentOptions = useMemo(() => {
    const links = student?.parents ?? [];
    return [
      { value: "", label: "Ota-onani tanlang" },
      ...links.map((l) => ({
        value: l.parent.id,
        label: `${l.parent.lastName ?? ""} ${l.parent.firstName}`.trim(),
      })),
    ];
  }, [student]);

  const tutorOptions = useMemo(() => {
    const items = tutorsPage?.items ?? [];
    return [
      { value: "", label: "Tyutorni tanlang" },
      ...items.map((u) => ({ value: u.id, label: u.fullName })),
    ];
  }, [tutorsPage]);

  const parentTypeOptions = [
    { value: "", label: "Ota-ona turini tanlang" },
    ...PARENT_TYPES.map((t) => ({ value: t, label: PARENT_TYPE_LABELS[t] })),
  ];
  const sentimentOptions = [
    { value: "", label: "Munosabatni tanlang" },
    ...COMM_SENTIMENTS.map((s) => ({ value: s, label: COMM_SENTIMENT_LABELS[s] })),
  ];

  const pending = create.isPending || update.isPending;

  async function submit() {
    setError(null);
    if (!studentId) return setError("O‘quvchini tanlang");
    if (!parentType) return setError("Ota-ona turini tanlang");
    if (!sentiment) return setError("Ota-ona munosabatini tanlang");

    const payload = {
      classId: classId || undefined,
      studentId,
      parentId: parentId || undefined,
      parentType: parentType as ParentType,
      sentiment: sentiment as CommSentiment,
      tutorId: tutorId || undefined,
      educationScore: toScore(educationScore),
      classLeaderScore: toScore(classLeaderScore),
      extracurricularScore: toScore(extracurricularScore),
      organizationalScore: toScore(organizationalScore),
      purpose: purpose.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEdit && editing) {
        await update.mutateAsync({ id: editing.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Muloqotni tahrirlash" : "Muloqot qo‘shish"}
      subtitle="Yangi muloqot ma'lumotlarini kiriting"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button loading={pending} onClick={submit}>
            <Check className="h-4 w-4" /> {isEdit ? "Yangilash" : "Yaratish"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Guruh & o'quvchi */}
        <div className={SECTION}>
          <span className={SECTION_TITLE}>Guruh & o‘quvchi</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1 block">
                Guruh
              </label>
              <Select
                options={classOptions}
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setStudentId("");
                  setParentId("");
                }}
              />
            </div>
            <div>
              <label className="label mb-1 block">
                O‘quvchi <span className="text-negative">*</span>
              </label>
              <Select
                options={studentOptions}
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setParentId("");
                }}
              />
            </div>
          </div>
        </div>

        {/* Ota-ona ma'lumotlari */}
        <div className={SECTION}>
          <span className={SECTION_TITLE}>Ota-ona ma'lumotlari</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1 block">Ota-ona</label>
              <Select options={parentOptions} value={parentId} onChange={(e) => setParentId(e.target.value)} />
            </div>
            <div>
              <label className="label mb-1 block">
                Ota-ona turi <span className="text-negative">*</span>
              </label>
              <Select
                options={parentTypeOptions}
                value={parentType}
                onChange={(e) => setParentType(e.target.value as ParentType | "")}
              />
            </div>
          </div>
        </div>

        {/* Munosabat & sinf rahbari */}
        <div className={SECTION}>
          <span className={SECTION_TITLE}>Munosabat & sinf rahbari</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1 block">
                Ota-ona munosabati <span className="text-negative">*</span>
              </label>
              <Select
                options={sentimentOptions}
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value as CommSentiment | "")}
              />
            </div>
            <div>
              <label className="label mb-1 block">Tyutor</label>
              <Select options={tutorOptions} value={tutorId} onChange={(e) => setTutorId(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Baholar */}
        <div className={SECTION}>
          <span className={SECTION_TITLE}>Baholar</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreField label="Ta'lim bali" value={educationScore} onChange={setEducationScore} />
            <ScoreField label="Sinf yetakchisi bali" value={classLeaderScore} onChange={setClassLeaderScore} />
            <ScoreField label="Darsdan tashqari ball" value={extracurricularScore} onChange={setExtracurricularScore} />
            <ScoreField label="Tashkiliy ball" value={organizationalScore} onChange={setOrganizationalScore} />
          </div>
        </div>

        {/* Maqsad va izoh */}
        <div className={SECTION}>
          <span className={SECTION_TITLE}>Maqsad va izoh</span>
          <div className="space-y-3">
            <div>
              <label className="label mb-1 block">Maqsad</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                placeholder="Maqsadni kiriting..."
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-amber focus-visible:focus-ring"
              />
            </div>
            <div>
              <label className="label mb-1 block">Izohlar</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Izoh kiriting..."
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-amber focus-visible:focus-ring"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Drawer>
  );
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label mb-1 block">{label}</label>
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0–100"
      />
    </div>
  );
}

function num(v: number | null | undefined): string {
  return v != null ? String(v) : "";
}

function toScore(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
