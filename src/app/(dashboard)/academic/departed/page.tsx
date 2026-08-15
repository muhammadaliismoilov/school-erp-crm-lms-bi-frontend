"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash2,
  UserMinus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  fullName,
  classLabel,
  useDepartedStudents,
  useDepartedStats,
  usePermanentRemoveStudent,
  useRestoreStudent,
  type Gender,
  type Student,
} from "@/lib/api/students";
import { useClassList } from "@/lib/api/classes";
import { formatDateTimeDMY } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { useCrudPermissions } from "@/lib/auth/use-can";

const GENDER_TABS: { value: "" | Gender; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "male", label: "Erkak" },
  { value: "female", label: "Ayol" },
];

const GENDER_LABEL: Record<string, string> = {
  male: "Erkak",
  female: "Ayol",
  other: "Boshqa",
};

const PAGE_SIZE = 30;

export default function DepartedStudentsPage() {
  const { canUpdate, canDelete, canMutate } = useCrudPermissions("students");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"" | Gender>("");
  const [classId, setClassId] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const { data, isLoading, isError, refetch } = useDepartedStudents({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    gender: gender || undefined,
    classId: classId || undefined,
  });
  const { data: stats } = useDepartedStats();
  const { data: classData } = useClassList();
  const restoreStudent = useRestoreStudent();
  const permanentRemove = usePermanentRemoveStudent();

  const classOptions = useMemo(() => {
    const items = classData?.items ?? [];
    return [
      { value: "", label: "Sinfni tanlang" },
      ...[...items]
        .sort((a, b) => a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section))
        .map((c) => ({ value: c.id, label: `${c.gradeLevel}-${c.section}` })),
    ];
  }, [classData]);

  const hasFilters = gender !== "" || classId !== "" || search !== "";

  function clearFilters() {
    setGender("");
    setClassId("");
    setSearch("");
    setPage(1);
  }

  async function confirmRestore() {
    if (!restoring) return;
    await restoreStudent.mutateAsync(restoring.id);
    setRestoring(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await permanentRemove.mutateAsync(deleting.id);
    setDeleting(null);
  }

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="stagger" onClick={() => menuFor && setMenuFor(null)}>
      <PageHeader
        title="Ketgan o‘quvchilar ro‘yxati"
        subtitle="Ro‘yxatdan o‘chirilgan (chiqib ketgan) o‘quvchilar"
      />

      {/* Statistika */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Ketgan o‘quvchilar"
          value={stats?.total ?? "—"}
          icon={<UserMinus className="h-5 w-5" />}
          tone="rose"
        />
        <StatCard
          label="Erkak"
          value={stats?.male ?? "—"}
          icon={<UserRound className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Ayol"
          value={stats?.female ?? "—"}
          icon={<Users className="h-5 w-5" />}
          tone="violet"
        />
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
            placeholder="O‘quvchi qidirish"
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

        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" /> Filtrlarni tozalash
          </Button>
        )}
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/40">
                <th className="label px-4 py-3 text-left">№</th>
                <th className="label px-4 py-3 text-left">O‘chirilgan vaqti</th>
                <th className="label px-4 py-3 text-left">To‘liq ismi</th>
                <th className="label px-4 py-3 text-left">Sinf</th>
                <th className="label px-4 py-3 text-left">Jinsi</th>
                <th className="label px-4 py-3 text-left">Sababi</th>
                <th className="label px-4 py-3 text-right">Amallar</th>
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
                  <td colSpan={7} className="py-20 text-center">
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-parchment text-ink-muted">
                      <UserMinus className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-ink-muted">Ma'lumotlar yo‘q</p>
                  </td>
                </tr>
              )}

              {rows.map((s, i) => {
                const cls = classLabel(s.currentClass);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-line/60 transition-colors last:border-0 hover:bg-parchment/50"
                  >
                    <td className="px-4 py-3 tnum text-ink-muted">{from + i}</td>
                    <td className="px-4 py-3 tnum text-ink-soft">
                      {formatDateTimeDMY(s.deletedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={fullName(s)} seed={s.id} photoUrl={s.photoUrl} />
                        <span className="font-medium text-ink">{fullName(s)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {cls ? (
                        <Badge tone="neutral">{cls}</Badge>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {s.gender ? GENDER_LABEL[s.gender] ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {s.withdrawalReason ? (
                        <span className="line-clamp-2 max-w-[260px]">{s.withdrawalReason}</span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
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
                            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
                              {canUpdate && (
                                <button
                                  onClick={() => {
                                    setRestoring(s);
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
                                >
                                  <RotateCcw className="h-4 w-4" /> Tiklash
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
                                  <Trash2 className="h-4 w-4" /> Butunlay o‘chirish
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
              <span className="tnum text-ink">
                {from} – {to}
              </span>{" "}
              / <span className="tnum">{total}</span>
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

      {/* Tiklash */}
      <Modal
        open={Boolean(restoring)}
        onClose={() => setRestoring(null)}
        title="O‘quvchini tiklash"
        subtitle={restoring ? fullName(restoring) : undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestoring(null)}>
              Bekor qilish
            </Button>
            <Button loading={restoreStudent.isPending} onClick={confirmRestore}>
              <RotateCcw className="h-4 w-4" /> Tiklash
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Ushbu o‘quvchi faol ro‘yxatga qaytariladi va “Ketgan o‘quvchilar” ro‘yxatidan olib
          tashlanadi.
        </p>
      </Modal>

      {/* Butunlay o‘chirish */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Butunlay o‘chirish"
        subtitle={deleting ? fullName(deleting) : undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" loading={permanentRemove.isPending} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> Butunlay o‘chirish
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Ushbu o‘quvchi ma'lumotlari butunlay o‘chiriladi. Bu amalni{" "}
          <span className="font-semibold text-negative">qaytarib bo‘lmaydi</span>.
        </p>
      </Modal>
    </div>
  );
}
