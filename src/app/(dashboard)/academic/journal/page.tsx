"use client";

import { useMemo, useState } from "react";
import { BookOpen, CalendarRange, GraduationCap, Layers } from "lucide-react";
import { useClasses, useQuarters, useSubjects } from "@/lib/api/academic";
import {
  useGradebook,
  useUpsertGrade,
  type GradebookCell,
} from "@/lib/api/gradebook";
import { Spinner } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

const ROMAN = ["I", "II", "III", "IV"];

type Tab = "class" | "course";

export default function JournalPage() {
  const [tab, setTab] = useState<Tab>("class");
  const [quarterNumber, setQuarterNumber] = useState(4);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const classes = useClasses();
  const subjects = useSubjects();
  const quarters = useQuarters();

  const quarterId = useMemo(
    () =>
      quarters.data?.find((q) => q.quarterNumber === quarterNumber)?.id ?? "",
    [quarters.data, quarterNumber],
  );

  const filter = { classId, subjectId, quarterId };
  const gradebook = useGradebook(filter);
  const upsert = useUpsertGrade(filter);

  const selectionReady = Boolean(classId && subjectId && quarterId);

  return (
    <div className="stagger">
      {/* Heading */}
      <div className="mb-5 flex items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-paper">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Elektron jurnal
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Sinf va fan bo‘yicha baholarni boshqaring
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1">
        <TabButton active={tab === "class"} onClick={() => setTab("class")}>
          Sinf jurnali
        </TabButton>
        <TabButton active={tab === "course"} onClick={() => setTab("course")}>
          Kurs jurnali
        </TabButton>
      </div>

      {/* Filters */}
      <div className="card mb-6 grid gap-5 p-5 lg:grid-cols-3">
        <Filter icon={CalendarRange} label="Choraklik">
          <div className="inline-flex w-full rounded-lg border border-line bg-surface p-1">
            {ROMAN.map((roman, i) => {
              const n = i + 1;
              const exists = quarters.data?.some((q) => q.quarterNumber === n);
              const active = quarterNumber === n;
              return (
                <button
                  key={roman}
                  type="button"
                  disabled={!exists && !quarters.isLoading}
                  onClick={() => setQuarterNumber(n)}
                  className={cn(
                    "h-9 flex-1 rounded-md text-sm font-medium transition-colors disabled:opacity-40",
                    active
                      ? "bg-accent text-accent-fg shadow-card"
                      : "text-ink-soft hover:text-ink",
                  )}
                >
                  {roman}
                </button>
              );
            })}
          </div>
        </Filter>

        <Filter icon={GraduationCap} label="Sinf">
          <Select
            value={classId}
            onChange={setClassId}
            placeholder="Sinfni tanlang"
            loading={classes.isLoading}
            options={(classes.data ?? []).map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Filter>

        <Filter icon={Layers} label="Fan">
          <Select
            value={subjectId}
            onChange={setSubjectId}
            placeholder="Fan tanlang"
            loading={subjects.isLoading}
            options={(subjects.data ?? []).map((s) => ({
              value: s.id,
              label: s.name,
            }))}
          />
        </Filter>
      </div>

      {tab === "course" ? (
        <EmptyState
          title="Kurs jurnali"
          subtitle="Kurs jurnalini ko‘rish uchun kursni tanlang"
        />
      ) : !classId ? (
        <EmptyState
          title="Sinfni tanlang"
          subtitle="Elektron jurnalni ko‘rish uchun sinfni tanlang"
        />
      ) : !subjectId ? (
        <EmptyState
          title="Fanni tanlang"
          subtitle="Jurnalni ko‘rish uchun fanni tanlang"
        />
      ) : gradebook.isLoading || !selectionReady ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : gradebook.isError ? (
        <EmptyState title="Xatolik" subtitle="Jurnalni yuklab bo‘lmadi" tone="error" />
      ) : (
        <GradebookGrid
          lessons={gradebook.data!.lessons}
          students={gradebook.data!.students}
          cells={gradebook.data!.cells}
          onSave={(input) => upsert.mutate(input)}
          saving={upsert.isPending}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-accent text-accent-fg shadow-card"
          : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Filter({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarRange;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-ink-soft">
        <Icon className="h-4 w-4 text-accent" />
        <span className="label">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  loading?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring disabled:opacity-50"
    >
      <option value="">{loading ? "Yuklanmoqda…" : placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function EmptyState({
  title,
  subtitle,
  tone = "neutral",
}: {
  title: string;
  subtitle: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div className="card grid place-items-center border-dashed py-20 text-center">
      <span
        className={cn(
          "mb-5 grid h-20 w-20 place-items-center rounded-full",
          tone === "error"
            ? "bg-negative/10 text-negative"
            : "bg-parchment-deep text-ink-muted/70",
        )}
      >
        <BookOpen className="h-9 w-9" />
      </span>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-ink-muted">{subtitle}</p>
    </div>
  );
}

function GradebookGrid({
  lessons,
  students,
  cells,
  onSave,
  saving,
}: {
  lessons: { id: string; lessonDate: string; topic?: string | null }[];
  students: {
    id: string;
    fullName: string;
    studentCode: string;
    average?: number | null;
  }[];
  cells: GradebookCell[];
  onSave: (input: {
    lessonId: string;
    studentId: string;
    grade?: number | null;
  }) => void;
  saving: boolean;
}) {
  const cellMap = useMemo(() => {
    const map = new Map<string, GradebookCell>();
    for (const c of cells) map.set(`${c.lessonId}:${c.studentId}`, c);
    return map;
  }, [cells]);

  if (students.length === 0) {
    return (
      <EmptyState
        title="O‘quvchilar yo‘q"
        subtitle="Bu sinfda faol o‘quvchilar topilmadi"
      />
    );
  }

  return (
    <div className="card overflow-hidden">
      {lessons.length === 0 && (
        <p className="border-b border-line bg-caution/8 px-4 py-2.5 text-sm text-ink-soft">
          Bu chorak uchun darslar kiritilmagan — baho qo‘yish uchun avval{" "}
          <span className="font-medium text-ink">Dars jadvali</span>ga dars
          qo‘shing.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment-deep/40">
              <th className="sticky left-0 z-10 min-w-[220px] bg-parchment-deep/95 px-4 py-3 text-left label">
                O‘quvchi
              </th>
              {lessons.map((lesson) => (
                <th
                  key={lesson.id}
                  className="min-w-[52px] px-1 py-3 text-center label"
                  title={lesson.topic ?? undefined}
                >
                  {formatDate(lesson.lessonDate).slice(0, 5)}
                </th>
              ))}
              <th className="min-w-[64px] px-3 py-3 text-center label">O‘rtacha</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr
                key={student.id}
                className="border-b border-line/70 last:border-0 hover:bg-parchment/50"
              >
                <td className="sticky left-0 z-10 bg-surface px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="tnum w-5 text-right text-xs text-ink-muted">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-ink">
                      {student.fullName}
                    </span>
                  </div>
                </td>
                {lessons.map((lesson) => (
                  <td key={lesson.id} className="px-1 py-1.5 text-center">
                    <GradeCell
                      value={
                        cellMap.get(`${lesson.id}:${student.id}`)?.grade ?? null
                      }
                      disabled={saving}
                      onSave={(grade) =>
                        onSave({
                          lessonId: lesson.id,
                          studentId: student.id,
                          grade,
                        })
                      }
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  <span
                    className={cn(
                      "tnum font-semibold",
                      student.average == null
                        ? "text-ink-muted"
                        : student.average >= 4.5
                          ? "text-positive"
                          : student.average >= 3
                            ? "text-amber"
                            : "text-negative",
                    )}
                  >
                    {student.average?.toFixed(2) ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GradeCell({
  value,
  onSave,
  disabled,
}: {
  value: number | null;
  onSave: (grade: number | null) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));

  // Keep local draft in sync when the server value changes.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value == null ? "" : String(value));
  }

  function commit() {
    const trimmed = draft.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (Number.isNaN(next) || next < 1 || next > 5)) {
      setDraft(value == null ? "" : String(value)); // revert invalid
      return;
    }
    if (next !== value) onSave(next);
  }

  return (
    <input
      inputMode="numeric"
      maxLength={1}
      disabled={disabled}
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^1-5]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={cn(
        "h-9 w-9 rounded-md border border-line bg-surface text-center text-sm font-semibold text-ink",
        "focus:border-accent focus-visible:focus-ring",
        draft === "5" && "border-positive/40 text-positive",
        draft === "4" && "border-emerald-400/40 text-emerald-600",
        draft === "3" && "border-amber/40 text-amber",
        (draft === "2" || draft === "1") && "border-negative/40 text-negative",
      )}
    />
  );
}
