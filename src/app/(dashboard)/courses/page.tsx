"use client";

import { useMemo, useState } from "react";
import {
  BookMarked,
  CalendarDays,
  DoorClosed,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCourseList, useDeleteCourse, type Course } from "@/lib/api/courses";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useRowActionsColumn, type RowAction } from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { DatePicker } from "@/components/ui/date-picker";
import { CourseFormDrawer } from "@/components/academic/course-form-drawer";
import { CourseDetailDrawer } from "@/components/academic/course-detail-drawer";
import { CourseStudentsDrawer } from "@/components/academic/course-students-drawer";
import { cn, formatMoney } from "@/lib/utils";

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

export default function CoursesPage() {
  const { t } = useI18n();

  const [search, setSearch] = useState("");
  const [quarterNumber, setQuarterNumber] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [studentsId, setStudentsId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ search, quarterNumber, startDate: startDate || undefined, endDate: endDate || undefined, page }),
    [search, quarterNumber, startDate, endDate, page],
  );
  const { data, isLoading, isError, refetch } = useCourseList(filters);
  const remove = useDeleteCourse();

  const stats = data?.stats;
  const rows = data?.items ?? [];

  const hasFilters = Boolean(search || quarterNumber || startDate || endDate);
  const clearFilters = () => {
    setSearch("");
    setQuarterNumber(undefined);
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (course: Course) => {
    setEditing(course);
    setFormOpen(true);
  };

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

  const rowActions: RowAction<Course>[] = [
    {
      key: "detail",
      label: t("courses.detail.title"),
      icon: Eye,
      permission: "academic-courses.read",
      onSelect: (c) => setDetailId(c.id),
    },
    {
      key: "students",
      label: t("courses.students.title"),
      icon: UserPlus,
      permission: "academic-courses.update",
      onSelect: (c) => setStudentsId(c.id),
    },
    {
      key: "update",
      label: t("common.edit"),
      icon: Pencil,
      permission: "academic-courses.update",
      onSelect: openEdit,
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: Trash2,
      tone: "danger",
      permission: "academic-courses.delete",
      onSelect: setDeleting,
    },
  ];
  const actionsColumn = useRowActionsColumn<Course>({
    actions: rowActions,
    header: t("courses.col.actions"),
  });

  const columns: Column<Course>[] = [
    {
      key: "index",
      header: "№",
      render: (c) => <span className="text-ink-muted tnum">{rows.indexOf(c) + 1}</span>,
    },
    {
      key: "name",
      header: t("courses.col.name"),
      render: (c) => (
        <span className="inline-flex items-center gap-2 font-medium text-ink">
          <BookMarked className="h-4 w-4 text-ink-muted" />
          {c.name}
        </span>
      ),
    },
    {
      key: "subject",
      header: t("courses.col.subject"),
      render: (c) => (
        <Badge tone="accent">
          <span className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: c.subject.color }} />
          {c.subject.name}
        </Badge>
      ),
    },
    {
      key: "teacher",
      header: t("courses.col.teacher"),
      render: (c) => <span className="text-sm text-ink-soft">{c.teacher.fullName}</span>,
    },
    {
      key: "room",
      header: t("courses.col.room"),
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
          <DoorClosed className="h-3.5 w-3.5 text-ink-muted" />
          {c.room.label || "—"}
        </span>
      ),
    },
    {
      key: "lessons",
      header: t("courses.col.lessons"),
      render: (c) => (
        <span className="text-sm text-ink-soft tnum">
          {c.stats.completedLessonCount}/{c.stats.plannedLessonCount}
        </span>
      ),
    },
    {
      key: "students",
      header: t("courses.col.students"),
      render: (c) => <span className="text-sm text-ink-soft tnum">{c.stats.studentCount}</span>,
    },
    ...actionsColumn,
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("courses.title")}
        subtitle={t("courses.listSubtitle")}
        action={
          <Can permission="academic-courses.create">
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("courses.new.button")}
              </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BookMarked className="h-5 w-5" />} label={t("courses.stats.total")} value={formatMoney(stats?.totalCourses ?? 0)} />
        <StatCard icon={<Users className="h-5 w-5" />} tone="positive" label={t("courses.stats.students")} value={formatMoney(stats?.totalStudents ?? 0)} />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} tone="info" label={t("courses.stats.teachers")} value={formatMoney(stats?.totalTeachers ?? 0)} />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          tone="warning"
          label={t("courses.stats.lessons")}
          value={`${stats?.completedLessons ?? 0}/${stats?.plannedLessons ?? 0}`}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("courses.searchPlaceholder")}
            className="pl-9"
          />
        </div>

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

        <div className="w-40">
          <DatePicker value={startDate} onChange={(v) => { setStartDate(v); setPage(1); }} placeholder={t("courses.f.startDate")} />
        </div>
        <div className="w-40">
          <DatePicker value={endDate} onChange={(v) => { setEndDate(v); setPage(1); }} placeholder={t("courses.f.endDate")} />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} aria-label={t("common.cancel")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {actionError && (
        <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{actionError}</p>
      )}

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
        rowKey={(c) => c.id}
      />

      <CourseFormDrawer open={formOpen} course={editing} onClose={() => setFormOpen(false)} />
      <CourseDetailDrawer open={Boolean(detailId)} courseId={detailId} onClose={() => setDetailId(null)} />
      <CourseStudentsDrawer open={Boolean(studentsId)} courseId={studentsId} onClose={() => setStudentsId(null)} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("courses.delete.title")}
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
          {t("courses.delete.confirm")} <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
