"use client";

import { useMemo, useState } from "react";
import { BookOpen, CalendarRange, GraduationCap, Layers, Sparkles, Users, Star, TrendingUp, CalendarCheck } from "lucide-react";
import { useClasses, useQuarters, useSubjects } from "@/lib/api/academic";
import {
  useGradebook,
  useUpsertGrade,
  useSetQuarterGrade,
  useGenerateLessons,
  useCoinPresets,
  useAwardCoin,
  attendanceTone,
  type Gradebook,
  type GradebookCell,
  type GradebookStudent,
} from "@/lib/api/gradebook";
import { Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/can";
import { useCan } from "@/lib/auth/use-can";
import { Switch } from "@/components/ui/switch";
import { cn, formatDate } from "@/lib/utils";
import { CellEditor } from "@/components/academic/journal/cell-editor";
import { QuarterGradePanel } from "@/components/academic/journal/quarter-grade-panel";
import { StudentDetailModal } from "@/components/academic/journal/student-detail-modal";

const ROMAN = ["I", "II", "III", "IV"];
type Tab = "class" | "course";

export default function JournalPage() {
  const [tab, setTab] = useState<Tab>("class");
  const [quarterNumber, setQuarterNumber] = useState(1);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [showAttendance, setShowAttendance] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [editorTarget, setEditorTarget] = useState<{ lesson: { id: string; lessonDate: string }; student: GradebookStudent; cell?: GradebookCell } | null>(null);
  const [quarterTarget, setQuarterTarget] = useState<GradebookStudent | null>(null);
  const [detailStudent, setDetailStudent] = useState<GradebookStudent | null>(null);


  const can = useCan();
  // Katakni tahrirlash/choraklik baho — gradebook yozuvini yangilaydi.
  const canEditGrades = can("lms-gradebook.update");
  const classes = useClasses();
  const subjects = useSubjects();
  const quarters = useQuarters();

  const quarterId = useMemo(
    () => quarters.data?.find((q) => q.quarterNumber === quarterNumber)?.id ?? "",
    [quarters.data, quarterNumber],
  );

  const filter = { classId, subjectId, quarterId };
  const gradebook = useGradebook(filter);
  const upsert = useUpsertGrade(filter);
  const quarterGrade = useSetQuarterGrade(filter);
  const generate = useGenerateLessons(filter);
  const award = useAwardCoin();
  const presets = useCoinPresets();

  const ready = Boolean(classId && subjectId && quarterId);
  const data = gradebook.data;

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 3500);
  };

  const runGenerate = () => {
    if (!ready) return;
    generate.mutate(
      { classId, subjectId, quarterId },
      {
        onSuccess: (r) => showToast(`${r.created} ta dars yaratildi`),
        onError: () => showToast("Avval Dars jadvalida darslar yarating"),
      },
    );
  };

  return (
    <div className="stagger">
      {/* Heading + generate */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-paper">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Elektron jurnal</h2>
            <p className="mt-0.5 text-sm text-ink-muted">Baho, ball, davomat va choraklik bahoni boshqaring</p>
          </div>
        </div>
        <Can permission="lms-journal.create">
          <Button variant="accent" onClick={runGenerate} loading={generate.isPending} disabled={!ready}>
            <Sparkles className="h-4 w-4" /> Darslarni generatsiya qilish
          </Button>
        </Can>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1">
        <TabButton active={tab === "class"} onClick={() => setTab("class")}>Sinf jurnali</TabButton>
        <TabButton active={tab === "course"} onClick={() => setTab("course")}>Kurs jurnali</TabButton>
      </div>

      {/* Filters */}
      <div className="card mb-5 grid gap-5 p-5 lg:grid-cols-3">
        <Filter icon={CalendarRange} label="Choraklik">
          <div className="inline-flex w-full rounded-lg border border-line bg-surface p-1">
            {ROMAN.map((roman, i) => {
              const n = i + 1;
              const exists = quarters.data?.some((q) => q.quarterNumber === n);
              return (
                <button
                  key={roman}
                  type="button"
                  disabled={!exists && !quarters.isLoading}
                  onClick={() => setQuarterNumber(n)}
                  className={cn(
                    "h-9 flex-1 rounded-md text-sm font-medium transition-colors disabled:opacity-40",
                    quarterNumber === n ? "bg-accent text-accent-fg shadow-card" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {roman}
                </button>
              );
            })}
          </div>
        </Filter>
        <Filter icon={GraduationCap} label="Sinf">
          <Select value={classId} onChange={setClassId} placeholder="Sinfni tanlang" loading={classes.isLoading}
            options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        </Filter>
        <Filter icon={Layers} label="Fan">
          <Select value={subjectId} onChange={setSubjectId} placeholder="Fan tanlang" loading={subjects.isLoading}
            options={(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name }))} />
        </Filter>
      </div>

      {/* Stats */}
      {ready && data && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="O‘quvchilar" value={String(data.stats.studentCount)} />
          <StatCard icon={TrendingUp} label="O‘rtacha" value={data.stats.averageGrade != null ? data.stats.averageGrade.toFixed(1) : "—"} />
          <StatCard icon={Star} label="A‘lochi" value={String(data.stats.excellentCount)} />
          <StatCard icon={CalendarCheck} label="Davomat" value={`${data.stats.attendancePct}%`} />
        </div>
      )}

      {tab === "course" ? (
        <EmptyState title="Kurs jurnali" subtitle="Kurs jurnalini ko‘rish uchun kursni tanlang" />
      ) : !classId ? (
        <EmptyState title="Sinfni tanlang" subtitle="Elektron jurnalni ko‘rish uchun sinfni tanlang" />
      ) : !subjectId ? (
        <EmptyState title="Fanni tanlang" subtitle="Jurnalni ko‘rish uchun fanni tanlang" />
      ) : gradebook.isLoading || !ready ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : gradebook.isError ? (
        <EmptyState title="Xatolik" subtitle="Jurnalni yuklab bo‘lmadi" tone="error" />
      ) : data ? (
        <>
          {/* Davomat toggle */}
          <div className="mb-3 flex items-center gap-2">
            <Switch checked={showAttendance} onCheckedChange={setShowAttendance} aria-label="Davomat" />
            <span className="text-sm text-ink-soft">Davomat ko‘rinishi</span>
          </div>
          {showAttendance ? (
            <AttendanceGrid
              data={data}
              onCell={
                canEditGrades
                  ? (lesson, student, cell) => setEditorTarget({ lesson, student, cell })
                  : undefined
              }
            />
          ) : (
            <SummaryTable
              data={data}
              onQuarter={canEditGrades ? setQuarterTarget : undefined}
              onDetail={setDetailStudent}
            />
          )}
        </>
      ) : null}

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-positive/30 bg-surface px-4 py-2.5 text-sm text-ink shadow-card">
          <span className="mr-2 text-positive">✓</span>{toast}
        </div>
      )}

      {/* Modals */}
      {editorTarget && (
        <CellEditor
          open
          onClose={() => setEditorTarget(null)}
          lesson={editorTarget.lesson}
          student={editorTarget.student}
          cell={editorTarget.cell}
          presets={presets.data ?? []}
          saving={upsert.isPending}
          onSave={(input) => upsert.mutate(input)}
          onAward={(input) => award.mutate(input, { onSuccess: () => showToast(`${input.reason}: ${input.type === "earn" ? "+" : "−"}${input.amount}`) })}
        />
      )}
      {quarterTarget && (
        <QuarterGradePanel
          open
          onClose={() => setQuarterTarget(null)}
          student={quarterTarget}
          subjectId={subjectId}
          quarterId={quarterId}
          saving={quarterGrade.isPending}
          onSave={(input) => quarterGrade.mutate(input, { onSuccess: () => showToast("Choraklik baho saqlandi") })}
        />
      )}
      {detailStudent && (
        <StudentDetailModal open onClose={() => setDetailStudent(null)} studentId={detailStudent.id} studentName={detailStudent.fullName} quarterId={quarterId} />
      )}
    </div>
  );
}

function SummaryTable({
  data,
  onQuarter,
  onDetail,
}: {
  data: Gradebook;
  /** Berilmasa — choraklik baho faqat ko'rsatiladi (tahrirlash ruxsati yo'q). */
  onQuarter?: (s: GradebookStudent) => void;
  onDetail: (s: GradebookStudent) => void;
}) {
  if (data.students.length === 0) return <EmptyState title="O‘quvchilar yo‘q" subtitle="Bu sinfda faol o‘quvchilar topilmadi" />;
  return (
    <div className="card overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-parchment-deep/40">
            <th className="px-4 py-3 text-left label">O‘quvchi</th>
            <th className="px-4 py-3 text-center label">Choraklik baho</th>
            <th className="px-4 py-3 text-center label">O‘rtacha</th>
          </tr>
        </thead>
        <tbody>
          {data.students.map((s, i) => (
            <tr key={s.id} className="border-b border-line/70 last:border-0 hover:bg-parchment/50">
              <td className="px-4 py-2.5">
                <button type="button" onClick={() => onDetail(s)} className="flex items-center gap-2 text-left hover:text-accent">
                  <span className="tnum w-5 text-right text-xs text-ink-muted">{i + 1}</span>
                  <span className="font-medium text-ink">{s.fullName}</span>
                </button>
              </td>
              <td className="px-4 py-2.5 text-center">
                <button
                  type="button"
                  disabled={!onQuarter}
                  onClick={() => onQuarter?.(s)}
                  className={cn(
                    "inline-flex h-9 min-w-[40px] items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors",
                    "disabled:cursor-default",
                    s.quarterGrade != null ? "border-accent/40 bg-accent/10 text-ink" : "border-dashed border-line text-ink-muted hover:bg-parchment",
                  )}
                >
                  {s.quarterGrade ?? "—"}
                  {s.quarterBall != null && <span className="ml-1 text-xs text-ink-muted">({s.quarterBall})</span>}
                </button>
              </td>
              <td className="px-4 py-2.5 text-center">
                <span className={cn("tnum font-semibold", s.average == null ? "text-ink-muted" : s.average >= 4.5 ? "text-positive" : s.average >= 3 ? "text-amber" : "text-negative")}>
                  {s.average?.toFixed(2) ?? "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttendanceGrid({
  data,
  onCell,
}: {
  data: Gradebook;
  /** Berilmasa — kataklar faqat o'qish uchun. */
  onCell?: (
    lesson: { id: string; lessonDate: string },
    student: GradebookStudent,
    cell?: GradebookCell,
  ) => void;
}) {
  const cellMap = useMemo(() => {
    const m = new Map<string, GradebookCell>();
    for (const c of data.cells) m.set(`${c.lessonId}:${c.studentId}`, c);
    return m;
  }, [data.cells]);

  if (data.students.length === 0) return <EmptyState title="O‘quvchilar yo‘q" subtitle="Bu sinfda faol o‘quvchilar topilmadi" />;
  if (data.lessons.length === 0)
    return <EmptyState title="Darslar yo‘q" subtitle="Avval “Darslarni generatsiya qilish” tugmasini bosing" />;

  return (
    <div className="card overflow-x-auto">
      <table className="border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-parchment-deep/40">
            <th className="sticky left-0 z-10 min-w-[200px] bg-parchment-deep/95 px-4 py-3 text-left label">O‘quvchi</th>
            {data.lessons.map((l) => (
              <th key={l.id} className="min-w-[48px] px-1 py-3 text-center label" title={l.topic ?? undefined}>
                {formatDate(l.lessonDate).slice(0, 5)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.students.map((s, i) => (
            <tr key={s.id} className="border-b border-line/70 last:border-0 hover:bg-parchment/50">
              <td className="sticky left-0 z-10 bg-surface px-4 py-2">
                <span className="flex items-center gap-2">
                  <span className="tnum w-5 text-right text-xs text-ink-muted">{i + 1}</span>
                  <span className="font-medium text-ink">{s.fullName}</span>
                </span>
              </td>
              {data.lessons.map((l) => {
                const cell = cellMap.get(`${l.id}:${s.id}`);
                return (
                  <td key={l.id} className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      disabled={!onCell}
                      onClick={() => onCell?.({ id: l.id, lessonDate: l.lessonDate }, s, cell)}
                      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-line hover:border-accent disabled:cursor-default disabled:hover:border-line"
                      title={cell?.comment ?? undefined}
                    >
                      {cell?.grade != null ? (
                        <span className="text-sm font-semibold text-ink">{cell.grade}</span>
                      ) : (
                        <span className={cn("h-2.5 w-2.5 rounded-full", attendanceTone(cell?.attendance))} />
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent"><Icon className="h-5 w-5" /></span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="text-lg font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("rounded-lg px-5 py-2 text-sm font-semibold transition-colors", active ? "bg-accent text-accent-fg shadow-card" : "text-ink-soft hover:text-ink")}>
      {children}
    </button>
  );
}

function Filter({ icon: Icon, label, children }: { icon: typeof CalendarRange; label: string; children: React.ReactNode }) {
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

function Select({ value, onChange, options, placeholder, loading }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string; loading?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading}
      className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring disabled:opacity-50">
      <option value="">{loading ? "Yuklanmoqda…" : placeholder}</option>
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

function EmptyState({ title, subtitle, tone = "neutral" }: { title: string; subtitle: string; tone?: "neutral" | "error" }) {
  return (
    <div className="card grid place-items-center border-dashed py-20 text-center">
      <span className={cn("mb-5 grid h-20 w-20 place-items-center rounded-full", tone === "error" ? "bg-negative/10 text-negative" : "bg-parchment-deep text-ink-muted/70")}>
        <BookOpen className="h-9 w-9" />
      </span>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-ink-muted">{subtitle}</p>
    </div>
  );
}
