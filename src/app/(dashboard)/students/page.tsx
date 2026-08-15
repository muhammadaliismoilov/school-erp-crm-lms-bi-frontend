"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  UserRound,
} from "lucide-react";
import {
  classLabel,
  fullName,
  primaryParent,
  useDeleteStudent,
  useStudents,
  useStudentStats,
  type Gender,
  type Student,
} from "@/lib/api/students";
import { useClassList } from "@/lib/api/classes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentFormDrawer } from "@/components/students/student-form-drawer";
import { useCrudPermissions } from "@/lib/auth/use-can";
import { Can } from "@/components/auth/can";

const statusTone: Record<string, "positive" | "neutral" | "caution" | "negative"> = {
  active: "positive",
  applicant: "neutral",
  graduated: "neutral",
  transferred: "caution",
  withdrawn: "negative",
};

const statusLabel: Record<string, string> = {
  active: "Faol",
  applicant: "Nomzod",
  graduated: "Bitirgan",
  transferred: "Ko‘chgan",
  withdrawn: "Chiqgan",
};

const GENDER_TABS: { value: "" | Gender; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "male", label: "Erkak" },
  { value: "female", label: "Ayol" },
];

export default function StudentsPage() {
  const router = useRouter();
  const { canUpdate, canDelete, canMutate } = useCrudPermissions("students");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"" | Gender>("");
  const [classId, setClassId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useStudents({
    page,
    limit: 20,
    search: search || undefined,
    gender: gender || undefined,
    classId: classId || undefined,
  });
  const { data: stats } = useStudentStats();
  const { data: classData } = useClassList();
  const deleteStudent = useDeleteStudent();

  const classOptions = useMemo(() => {
    const items = classData?.items ?? [];
    return [
      { value: "", label: "Barcha sinflar" },
      ...[...items]
        .sort((a, b) => a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section))
        .map((c) => ({ value: c.id, label: `${c.gradeLevel}-${c.section}` })),
    ];
  }, [classData]);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setDrawerOpen(true);
    setMenuFor(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteStudent.mutateAsync({ id: deleting.id, reason: deleteReason.trim() || undefined });
    setDeleting(null);
    setDeleteReason("");
  }

  const rows = data?.items ?? [];
  const pageCount = data?.meta.pageCount ?? 1;

  return (
    <div className="stagger" onClick={() => menuFor && setMenuFor(null)}>
      <PageHeader
        title="O‘quvchilar ro‘yxati"
        subtitle="Barcha filiallar bo‘yicha o‘quvchilar"
        action={
          <Can permission="students.create">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              O‘quvchi qo‘shish
            </Button>
          </Can>
        }
      />

      {/* Statistika */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jami o‘quvchilar" value={stats?.total ?? "—"} icon={<Users className="h-5 w-5" />} tone="accent" />
        <StatCard label="O‘g‘il bolalar" value={stats?.male ?? "—"} icon={<UserRound className="h-5 w-5" />} tone="sky" />
        <StatCard label="Qiz bolalar" value={stats?.female ?? "—"} icon={<UserRound className="h-5 w-5" />} tone="rose" />
        <StatCard label="Shu oyda qo‘shilgan" value={stats?.newThisMonth ?? "—"} icon={<Plus className="h-5 w-5" />} tone="violet" />
      </div>

      {/* Filtrlar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Ism, kod yoki telefon bo‘yicha qidirish"
            className="pl-9"
          />
        </div>

        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          {GENDER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setGender(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                gender === tab.value
                  ? "bg-accent text-accent-fg"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-44">
          <Select
            options={classOptions}
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/40">
                <th className="label px-4 py-3 text-left">O‘quvchi</th>
                <th className="label px-4 py-3 text-left">Sinf</th>
                <th className="label px-4 py-3 text-left">ID kod</th>
                <th className="label px-4 py-3 text-left">Ota-ona</th>
                <th className="label px-4 py-3 text-left">Telefon</th>
                <th className="label px-4 py-3 text-left">Holat</th>
                <th className="label px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="grid place-items-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="mb-3 text-sm text-ink-muted">Ma'lumotni yuklab bo‘lmadi</p>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-ink-muted">
                    O‘quvchilar topilmadi
                  </td>
                </tr>
              )}

              {rows.map((s) => {
                const parent = primaryParent(s);
                const cls = classLabel(s.currentClass);
                return (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-parchment/50"
                    onClick={() => router.push(`/students/${s.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={fullName(s)} seed={s.id} photoUrl={s.photoUrl} />
                        <span className="font-medium text-ink">{fullName(s)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {cls ? <Badge tone="neutral">{cls}</Badge> : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-soft tnum">{s.studentCode}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {parent ? `${parent.firstName} ${parent.lastName ?? ""}`.trim() : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft tnum">{parent?.phone ?? s.personalPhone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[s.status ?? "active"] ?? "neutral"}>
                        {statusLabel[s.status ?? "active"] ?? s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {canMutate && (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setMenuFor(menuFor === s.id ? null : s.id)}
                            aria-label="Amallar"
                            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-parchment hover:text-ink"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuFor === s.id && (
                            <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
                              {canUpdate && (
                                <button
                                  onClick={() => openEdit(s)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
                                >
                                  <Pencil className="h-4 w-4" /> Tahrirlash
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    setDeleting(s);
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-negative hover:bg-negative/8"
                                >
                                  <Trash2 className="h-4 w-4" /> O‘chirish
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
            <span className="text-ink-muted">
              Jami: <span className="tnum text-ink">{data?.meta.total ?? 0}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Oldingi
              </Button>
              <span className="tnum text-ink-muted">
                {page} / {pageCount}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Keyingi
              </Button>
            </div>
          </div>
        )}
      </div>

      <StudentFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        student={editing}
        onSaved={() => refetch()}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => {
          setDeleting(null);
          setDeleteReason("");
        }}
        title="O‘quvchini o‘chirish"
        subtitle={deleting ? fullName(deleting) : undefined}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleting(null);
                setDeleteReason("");
              }}
            >
              Bekor qilish
            </Button>
            <Button variant="danger" loading={deleteStudent.isPending} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> O‘chirish
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Ushbu o‘quvchi ro‘yxatdan o‘chiriladi va “Ketgan o‘quvchilar” ro‘yxatiga o‘tadi. Bu amalni
          keyinroq tiklash mumkin (soft-delete).
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <Phone className="h-3.5 w-3.5" />
          {deleting && (primaryParent(deleting)?.phone ?? "—")}
        </p>
        <div className="mt-4">
          <label className="label mb-1.5 block">Ketish sababi (ixtiyoriy)</label>
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Masalan: boshqa maktabga ko‘chdi"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </div>
      </Modal>
    </div>
  );
}
