"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileClock,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  useDeleteExam,
  useExamList,
  useExamOptions,
  usePublishExam,
  type Exam,
  type ExamFilters,
  type ExamKind,
  type ExamStatus,
  type ExamType,
} from "@/lib/api/exams";
import { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ClassExamFormDrawer } from "@/components/academic/class-exam-form-drawer";
import { CourseExamFormDrawer } from "@/components/academic/course-exam-form-drawer";
import { cn, formatDate, formatMoney, loc } from "@/lib/utils";

const ROMAN = ["I", "II", "III", "IV"] as const;

function StatCard({
  icon,
  label,
  value,
  tone = "accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "accent" | "positive" | "warning" | "info";
}) {
  const tones = {
    accent: "bg-accent/12 text-accent",
    positive: "bg-positive/12 text-positive",
    warning: "bg-amber/12 text-amber-600",
    info: "bg-navy/10 text-navy",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink tnum">{value}</p>
      </div>
    </Card>
  );
}

const STATUS_TONE: Record<ExamStatus, "neutral" | "accent" | "positive"> = {
  draft: "neutral",
  scheduled: "accent",
  finished: "positive",
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(iso)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default function ProgressExamsPage() {
  const { t } = useI18n();
  const canManage = useAuthStore((s) => s.can)("lms.manage");

  const [kind, setKind] = useState<ExamKind>("class");

  const [quarterNumber, setQuarterNumber] = useState<number | undefined>(undefined);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [examType, setExamType] = useState<ExamType | "">("");
  const [status, setStatus] = useState<ExamStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [classDrawer, setClassDrawer] = useState(false);
  const [courseDrawer, setCourseDrawer] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState<Exam | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const options = useExamOptions();
  const remove = useDeleteExam();
  const publish = usePublishExam();

  const filters: ExamFilters = useMemo(
    () => ({
      kind,
      quarterNumber,
      classId: kind === "class" ? classId || undefined : undefined,
      subjectId: kind === "class" ? subjectId || undefined : undefined,
      teacherId: kind === "class" ? teacherId || undefined : undefined,
      courseId: kind === "course" ? courseId || undefined : undefined,
      examType: examType || undefined,
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
    }),
    [kind, quarterNumber, classId, subjectId, teacherId, courseId, examType, status, dateFrom, dateTo, page],
  );

  const { data, isLoading, isError, refetch } = useExamList(filters);
  const stats = data?.stats;
  const rows = data?.items ?? [];

  function switchKind(next: ExamKind) {
    setKind(next);
    setPage(1);
    setClassId("");
    setSubjectId("");
    setTeacherId("");
    setCourseId("");
  }

  const hasFilters = Boolean(
    quarterNumber || classId || subjectId || teacherId || courseId || examType || status || dateFrom || dateTo,
  );
  function clearFilters() {
    setQuarterNumber(undefined);
    setClassId("");
    setSubjectId("");
    setTeacherId("");
    setCourseId("");
    setExamType("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    if (kind === "class") setClassDrawer(true);
    else setCourseDrawer(true);
  }
  function openEdit(exam: Exam) {
    setEditing(exam);
    if (exam.examKind === "class") setClassDrawer(true);
    else setCourseDrawer(true);
  }
  function closeDrawers() {
    setClassDrawer(false);
    setCourseDrawer(false);
    setEditing(null);
  }

  async function doPublish(exam: Exam) {
    setActionError(null);
    try {
      await publish.mutateAsync(exam.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }
  async function confirmDelete() {
    if (!deleting) return;
    setActionError(null);
    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  const classOptions = (options.data?.classes ?? []).map((c) => ({ value: c.id, label: c.name }));
  const subjectOptions = (options.data?.subjects ?? []).map((s) => ({ value: s.id, label: loc(s.name) }));
  const teacherOptions = (options.data?.teachers ?? []).map((u) => ({ value: u.id, label: u.fullName }));
  const courseOptions = (options.data?.courses ?? []).map((c) => ({ value: c.id, label: c.name }));
  const typeOptions = [
    { value: "test", label: t("exam.type.test") },
    { value: "control_work", label: t("exam.type.control_work") },
    { value: "dictation", label: t("exam.type.dictation") },
  ];
  const statusOptions = [
    { value: "draft", label: t("exam.status.draft") },
    { value: "scheduled", label: t("exam.status.scheduled") },
    { value: "finished", label: t("exam.status.finished") },
  ];

  const columns: Column<Exam>[] = [
    { key: "index", header: "№", render: (e) => <span className="text-ink-muted tnum">{rows.indexOf(e) + 1}</span> },
    kind === "class"
      ? {
          key: "class",
          header: t("exam.col.class"),
          render: (e) => (
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <ClipboardList className="h-4 w-4 text-ink-muted" />
              {e.className ?? "—"}
            </span>
          ),
        }
      : {
          key: "course",
          header: t("exam.col.course"),
          render: (e) => (
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <ClipboardList className="h-4 w-4 text-ink-muted" />
              {e.courseName ?? "—"}
            </span>
          ),
        },
    { key: "subject", header: t("exam.col.subject"), render: (e) => <span className="text-sm text-ink-soft">{loc(e.subjectName) || "—"}</span> },
    { key: "teacher", header: t("exam.col.teacher"), render: (e) => <span className="text-sm text-ink-soft">{e.teacherName ?? "—"}</span> },
    { key: "type", header: t("exam.col.type"), render: (e) => <Badge tone="accent">{t(`exam.type.${e.examType}`)}</Badge> },
    { key: "date", header: t("exam.col.date"), render: (e) => <span className="tnum">{formatDate(e.examDate)}</span> },
    { key: "from", header: t("exam.col.from"), render: (e) => <span className="text-sm text-ink-soft tnum">{fmtDateTime(e.availableFrom)}</span> },
    { key: "to", header: t("exam.col.to"), render: (e) => <span className="text-sm text-ink-soft tnum">{fmtDateTime(e.availableUntil)}</span> },
    {
      key: "status",
      header: t("exam.col.status"),
      render: (e) => <Badge tone={STATUS_TONE[e.status]}>{t(`exam.status.${e.status}`)}</Badge>,
    },
    {
      key: "actions",
      header: t("exam.col.actions"),
      align: "right" as const,
      render: (e) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1">
            {e.status === "draft" && (
              <Button variant="ghost" size="sm" className="text-accent" onClick={() => doPublish(e)} aria-label={t("exam.action.publish")}>
                <Send className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => openEdit(e)} aria-label={t("common.edit")}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-negative" onClick={() => setDeleting(e)} aria-label={t("common.delete")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("exam.title")}
        subtitle={t("exam.subtitle")}
        action={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("exam.assign")}
            </Button>
          )
        }
      />

      <div className="mb-5 inline-flex rounded-lg border border-line bg-surface p-1">
        {(["class", "course"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => switchKind(k)}
            className={cn(
              "h-9 rounded-md px-4 text-sm font-medium transition-colors",
              kind === k ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-parchment",
            )}
          >
            {t(k === "class" ? "exam.tab.class" : "exam.tab.course")}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FileClock className="h-5 w-5" />} label={t("exam.stats.draft")} value={formatMoney(stats?.draft ?? 0)} />
        <StatCard icon={<ClipboardCheck className="h-5 w-5" />} tone="info" label={t("exam.stats.scheduled")} value={formatMoney(stats?.scheduled ?? 0)} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} tone="positive" label={t("exam.stats.finished")} value={formatMoney(stats?.finished ?? 0)} />
        <StatCard icon={<FileCheck2 className="h-5 w-5" />} tone="warning" label={t("exam.stats.results")} value={formatMoney(stats?.withResults ?? 0)} />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-lg border border-line bg-surface p-1">
          {ROMAN.map((roman, i) => {
            const n = i + 1;
            const active = quarterNumber === n;
            return (
              <button
                key={roman}
                type="button"
                onClick={() => {
                  setQuarterNumber(active ? undefined : n);
                  setPage(1);
                }}
                className={cn(
                  "h-8 w-10 rounded-md text-sm font-medium transition-colors",
                  active ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-parchment",
                )}
              >
                {roman}
              </button>
            );
          })}
        </div>

        {kind === "class" ? (
          <>
            <div className="w-40">
              <Select value={classId} onChange={(e) => { setClassId(e.target.value); setPage(1); }} options={classOptions} placeholder={t("exam.f.classPh")} />
            </div>
            <div className="w-40">
              <Select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setPage(1); }} options={subjectOptions} placeholder={t("exam.f.subjectPh")} />
            </div>
            <div className="w-44">
              <Select value={teacherId} onChange={(e) => { setTeacherId(e.target.value); setPage(1); }} options={teacherOptions} placeholder={t("exam.f.teacherPh")} />
            </div>
          </>
        ) : (
          <div className="w-48">
            <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setPage(1); }} options={courseOptions} placeholder={t("exam.f.coursePh")} />
          </div>
        )}

        <div className="w-44">
          <Select value={examType} onChange={(e) => { setExamType(e.target.value as ExamType | ""); setPage(1); }} options={typeOptions} placeholder={t("exam.f.typePh")} />
        </div>
        <div className="w-40">
          <Select value={status} onChange={(e) => { setStatus(e.target.value as ExamStatus | ""); setPage(1); }} options={statusOptions} placeholder={t("exam.f.statusPh")} />
        </div>
        <div className="w-40">
          <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t("exam.f.dateFrom")} />
        </div>
        <div className="w-40">
          <DatePicker value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t("exam.f.dateTo")} min={dateFrom || undefined} />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} aria-label={t("common.cancel")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {actionError && <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{actionError}</p>}

      <DataTable
        columns={columns}
        rows={isLoading ? undefined : rows}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        page={data?.page ?? 1}
        pageCount={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
        rowKey={(e) => e.id}
      />

      <ClassExamFormDrawer open={classDrawer} exam={editing?.examKind === "class" ? editing : null} onClose={closeDrawers} />
      <CourseExamFormDrawer open={courseDrawer} exam={editing?.examKind === "course" ? editing : null} onClose={closeDrawers} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("exam.delete.title")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={remove.isPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={remove.isPending}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t("exam.delete.confirm")} <span className="font-medium text-ink">{deleting?.title}</span>
        </p>
      </Modal>
    </div>
  );
}
