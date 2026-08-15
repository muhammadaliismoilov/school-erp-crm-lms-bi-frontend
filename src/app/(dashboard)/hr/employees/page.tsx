"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  GraduationCap,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  History,
  Palmtree,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_TONE,
  PAGE_SIZES,
  useDeleteStaff,
  useDepartments,
  usePositions,
  useSalaryHistory,
  useStaff,
  type EmploymentStatus,
  type StaffMember,
} from "@/lib/api/hr";
import { useHrStats } from "@/lib/api/hr-stats";
import { formatDateDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import {
  RowActions,
  useAnyRowAction,
  type RowAction,
} from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";
import { CredentialsModal, StaffFormModal } from "@/components/hr/staff-form-modal";

const STATUS_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "active", label: "Faol" },
  { value: "dismissed", label: "Faol emas" },
  { value: "on_leave", label: "Ta'tilda" },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | EmploymentStatus>("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [historyFor, setHistoryFor] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const { data, isLoading, isError, refetch } = useStaff({
    page,
    limit,
    search,
    status: status || undefined,
    departmentId: departmentId || undefined,
    positionId: positionId || undefined,
  });
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: stats } = useHrStats();
  const deleteStaff = useDeleteStaff();

  /** Karta bosilganda jadval status filtriga o'tadi (qayta bosilsa bekor bo'ladi). */
  function toggleStatusFilter(next: "" | EmploymentStatus) {
    setStatus((cur) => (cur === next ? "" : next));
    setPage(1);
  }

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const deptOptions = useMemo(
    () => [{ value: "", label: "Barchasi" }, ...(departments ?? []).map((d) => ({ value: d.id, label: d.name }))],
    [departments],
  );
  const posOptions = useMemo(
    () => [{ value: "", label: "Barchasi" }, ...(positions ?? []).map((p) => ({ value: p.id, label: p.title }))],
    [positions],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(s: StaffMember) {
    setEditing(s);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteStaff.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Xodim o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  const rowActions: RowAction<StaffMember>[] = [
    {
      key: "detail",
      label: "Batafsil",
      icon: Eye,
      permission: "hr-staff.read",
      onSelect: (s) => router.push(`/hr/employees/${s.id}`),
    },
    {
      key: "update",
      label: "Tahrirlash",
      icon: Pencil,
      permission: "hr-staff.update",
      onSelect: (s) => openEdit(s),
    },
    {
      key: "salaryHistory",
      label: "Maosh tarixi",
      icon: History,
      permission: "finance-salaries.read",
      onSelect: (s) => setHistoryFor(s),
    },
    {
      key: "delete",
      label: "O‘chirish",
      icon: Trash2,
      tone: "danger",
      permission: "hr-staff.delete",
      onSelect: (s) => setDeleting(s),
    },
  ];
  const showActions = useAnyRowAction(rowActions);
  const colCount = showActions ? 9 : 8;

  return (
    <div className="stagger">
      <PageHeader
        title="Xodimlar"
        action={
          <Can permission="hr-staff.create">
            <Button variant="accent" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Xodim qo‘shish
            </Button>
          </Can>
        }
      />

      {/* Yig'ma ko'rsatkichlar — karta bosilsa jadval o'sha status filtriga o'tadi */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Jami xodimlar"
          value={stats?.staff.total ?? 0}
          tone="accent"
          active={status === ""}
          onClick={() => toggleStatusFilter("")}
        />
        <StatCard
          icon={<BadgeCheck className="h-5 w-5" />}
          label="Faol"
          value={stats?.staff.active ?? 0}
          tone="positive"
          active={status === "active"}
          onClick={() => toggleStatusFilter("active")}
        />
        <StatCard
          icon={<Palmtree className="h-5 w-5" />}
          label="Ta'tilda (bugun)"
          value={stats?.staff.onLeaveToday ?? 0}
          tone="caution"
          active={status === "on_leave"}
          onClick={() => toggleStatusFilter("on_leave")}
        />
        <StatCard
          icon={<UserPlus className="h-5 w-5" />}
          label="Yangi (shu oy)"
          value={stats?.staff.newThisMonth ?? 0}
          tone="accent"
        />
      </div>

      {/* Filtrlar */}
      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Xodimlarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | EmploymentStatus);
            setPage(1);
          }}
        />
        <Select
          options={deptOptions}
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={posOptions}
          value={positionId}
          onChange={(e) => {
            setPositionId(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">To‘liq ism</th>
                <th className="px-4 py-3 font-medium">Bo‘lim</th>
                <th className="px-4 py-3 font-medium">Lavozim</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Ishga qabul sanasi</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {showActions && (
                  <th className="px-4 py-3 text-right font-medium">Amallar</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={colCount}>
                  <Spinner className="mx-auto h-5 w-5" />
                </StateRow>
              ) : isError ? (
                <StateRow colSpan={colCount}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={colCount}>
                  <span className="text-ink-muted">Ma‘lumot yo‘q</span>
                </StateRow>
              ) : (
                rows.map((s, i) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-parchment/40"
                    onClick={() => router.push(`/hr/employees/${s.id}`)}
                  >
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        {`${s.lastName} ${s.firstName}${s.middleName ? " " + s.middleName : ""}`}
                        {s.teacher && (
                          <span title="O'qituvchi" className="text-amber">
                            <GraduationCap className="h-4 w-4" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{s.department?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.position?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.email ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.hireDate ? formatDateDMY(s.hireDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={EMPLOYMENT_STATUS_TONE[s.status]}>
                        {EMPLOYMENT_STATUS_LABELS[s.status]}
                      </Badge>
                    </td>
                    {showActions && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <RowActions row={s} actions={rowActions} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-ink-muted">
            <span>Ko‘rsatilmoqda</span>
            <span className="tnum text-ink">{from} - {to}</span>
            <span>dan</span>
            <span className="tnum text-ink">{total}</span>
            <span>natija</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              className="h-8 w-20 py-0"
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            />
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tnum px-2 text-ink-muted">{page} / {pageCount}</span>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(pageCount)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <StaffFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onCreated={(creds, warning) => {
          setFormOpen(false);
          setToast(warning ?? "Xodim muvaffaqiyatli yaratildi");
          if (creds) setCredentials(creds);
        }}
        onUpdated={(warning) => {
          setFormOpen(false);
          setToast(warning ?? "Xodim ma‘lumotlari yangilandi");
        }}
      />

      <SalaryHistoryModal staff={historyFor} onClose={() => setHistoryFor(null)} />

      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Xodimni o‘chirish">
        <p className="text-sm text-ink-muted">
          {deleting && `${deleting.lastName} ${deleting.firstName}`} ro‘yxatdan o‘chiriladi
          {deleting?.teacher ? " (o‘qituvchilik yozuvi ham birga olib tashlanadi)" : ""}. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteStaff.isPending} onClick={confirmDelete}>O‘chirish</Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

function StateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        {children}
      </td>
    </tr>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "accent" | "positive" | "caution";
  active?: boolean;
  onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    accent: "bg-amber/15 text-amber",
    positive: "bg-emerald-500/15 text-emerald-600",
    caution: "bg-orange-500/15 text-orange-600",
  };
  const body = (
    <>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div className="text-left">
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="tnum text-2xl font-semibold text-ink">{value}</div>
      </div>
    </>
  );
  if (!onClick) return <Card className="flex items-center gap-3 p-4">{body}</Card>;
  return (
    <button type="button" onClick={onClick} className="text-left focus-visible:focus-ring rounded-xl">
      <Card
        className={`flex h-full items-center gap-3 p-4 transition-colors hover:border-amber ${
          active ? "border-amber" : ""
        }`}
      >
        {body}
      </Card>
    </button>
  );
}

// ─── Maosh tarixi modal ────────────────────────────────────────────────────

function SalaryHistoryModal({ staff, onClose }: { staff: StaffMember | null; onClose: () => void }) {
  const { data, isLoading } = useSalaryHistory(staff?.id ?? null);
  const rows = data ?? [];

  return (
    <Modal
      open={!!staff}
      onClose={onClose}
      title="Maosh tarixi"
      subtitle={staff ? `${staff.lastName} ${staff.firstName}` : undefined}
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Yopish</Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-2 font-medium">№</th>
              <th className="px-3 py-2 font-medium">O‘zgartirilgan sana</th>
              <th className="px-3 py-2 text-right font-medium">Eski maosh</th>
              <th className="px-3 py-2 text-right font-medium">Yangi maosh</th>
              <th className="px-3 py-2 font-medium">Sabab</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center"><Spinner className="mx-auto h-5 w-5" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-ink-muted">Maosh tarixi bo‘sh</td></tr>
            ) : (
              rows.map((h, i) => (
                <tr key={h.id} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                  <td className="px-3 py-2 text-ink-soft">{formatDateDMY(h.createdAt)}</td>
                  <td className="tnum px-3 py-2 text-right text-ink-soft">{h.oldSalary != null ? formatMoney(h.oldSalary) : "—"}</td>
                  <td className="tnum px-3 py-2 text-right font-medium text-ink">{formatMoney(h.newSalary)}</td>
                  <td className="px-3 py-2 text-ink-soft">{h.reason ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

