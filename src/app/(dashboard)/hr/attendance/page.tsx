"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  ATTENDANCE_ACTION_LABELS,
  ATTENDANCE_ACTIONS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_TONE,
  PAGE_SIZES,
  useAttendance,
  useCreateAttendance,
  useDeleteAttendance,
  useGeofenceOptions,
  useReviewAttendance,
  type AttendanceAction,
  type AttendanceInput,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/lib/api/hr-attendance";
import { useStaff } from "@/lib/api/hr";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import {
  RowActions,
  useAnyRowAction,
  type RowAction,
} from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";

const STATUS_FILTER = [
  { value: "", label: "Barchasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
];
const ACTION_FILTER = [
  { value: "", label: "Barchasi" },
  { value: "check_in", label: "Kirish" },
  { value: "check_out", label: "Chiqish" },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("uz");
}

export default function AttendancePage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | AttendanceStatus>("");
  const [action, setAction] = useState<"" | AttendanceAction>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<AttendanceRecord | null>(null);
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

  const { data, isLoading, isError, refetch } = useAttendance({
    page,
    limit,
    search,
    status: status || undefined,
    action: action || undefined,
  });
  const reviewAttendance = useReviewAttendance();
  const deleteAttendance = useDeleteAttendance();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const hasFilters = !!search || !!status || !!action;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setAction("");
    setPage(1);
  }

  async function review(record: AttendanceRecord, next: "approved" | "rejected") {
    try {
      await reviewAttendance.mutateAsync({ id: record.id, status: next });
      setToast(next === "approved" ? "Davomat tasdiqlandi" : "Davomat rad etildi");
    } catch {
      setToast("Amalni bajarishda xatolik");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteAttendance.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Davomat yozuvi o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  const rowActions: RowAction<AttendanceRecord>[] = [
    {
      key: "approve",
      label: "Tasdiqlash",
      icon: Check,
      tone: "positive",
      permission: "hr-attendance.update",
      hidden: (r) => r.status !== "pending",
      onSelect: (r) => review(r, "approved"),
    },
    {
      key: "reject",
      label: "Rad etish",
      icon: X,
      tone: "danger",
      permission: "hr-attendance.update",
      hidden: (r) => r.status !== "pending",
      onSelect: (r) => review(r, "rejected"),
    },
    {
      key: "delete",
      label: "O‘chirish",
      icon: Trash2,
      tone: "danger",
      permission: "hr-attendance.delete",
      onSelect: (r) => setDeleting(r),
    },
  ];
  const showActions = useAnyRowAction(rowActions);
  const colCount = showActions ? 7 : 6;

  return (
    <div className="stagger">
      <PageHeader
        title="Davomat"
        subtitle="Xodimlar davomatini kuzatish"
        action={
          <Can permission="hr-attendance.create">
            <Button variant="accent" onClick={() => setDrawerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yaratish
            </Button>
          </Can>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Davomatni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          options={STATUS_FILTER}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | AttendanceStatus);
            setPage(1);
          }}
        />
        <Select
          options={ACTION_FILTER}
          value={action}
          onChange={(e) => {
            setAction(e.target.value as "" | AttendanceAction);
            setPage(1);
          }}
        />
        {hasFilters && (
          <Button variant="secondary" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Tozalash
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Xodim</th>
                <th className="px-4 py-3 font-medium">Harakat</th>
                <th className="px-4 py-3 font-medium">Vaqt</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joylashuv</th>
                {showActions && (
                  <th className="px-4 py-3 text-right font-medium">Amallar</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={colCount}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={colCount}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={colCount}><span className="text-ink-muted">Ma‘lumot yo‘q</span></StateRow>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.staffName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-soft">
                        {r.action === "check_in" ? (
                          <LogIn className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <LogOut className="h-4 w-4 text-rose-500" />
                        )}
                        {ATTENDANCE_ACTION_LABELS[r.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(r.recordedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={ATTENDANCE_STATUS_TONE[r.status]}>{ATTENDANCE_STATUS_LABELS[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {r.geofenceName ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-ink-muted" />
                          {r.geofenceName}
                        </span>
                      ) : r.latitude != null && r.longitude != null ? (
                        <span className="tnum text-xs">
                          {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <RowActions row={r} actions={rowActions} />
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

      <AttendanceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Davomat yozuvini o‘chirish">
        <p className="text-sm text-ink-muted">{deleting?.staffName} davomati o‘chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteAttendance.isPending} onClick={confirmDelete}>O‘chirish</Button>
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
      <td colSpan={colSpan} className="px-4 py-12 text-center">{children}</td>
    </tr>
  );
}

function AttendanceDrawer({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createAttendance = useCreateAttendance();
  const { data: geofences } = useGeofenceOptions();
  const { data: staffData } = useStaff({ page: 1, limit: 100 });

  const [staffMemberId, setStaffMemberId] = useState("");
  const [action, setAction] = useState<AttendanceAction>("check_in");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geofenceId, setGeofenceId] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStaffMemberId("");
    setAction("check_in");
    setLatitude(null);
    setLongitude(null);
    setGeofenceId("");
    setDeviceInfo("");
    setError(null);
  }, [open]);

  const staffOptions = useMemo(
    () => [
      { value: "", label: "Xodimni tanlang" },
      ...(staffData?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` })),
    ],
    [staffData],
  );
  const geofenceOptions = useMemo(
    () => [{ value: "", label: "Geofenceni tanlang" }, ...(geofences ?? []).map((g) => ({ value: g.id, label: g.name }))],
    [geofences],
  );

  async function submit() {
    if (!staffMemberId) {
      setError("Xodimni tanlang");
      return;
    }
    const payload: AttendanceInput = {
      staffMemberId,
      action,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      geofenceId: geofenceId || undefined,
      deviceInfo: deviceInfo.trim() || undefined,
    };
    try {
      await createAttendance.mutateAsync(payload);
      onSaved("Davomat yozuvi yaratildi");
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Davomat yozish"
      subtitle="Yangi kirish yoki chiqish yozish"
      icon={<LogIn className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={createAttendance.isPending} onClick={submit}>Yaratish</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Xodim" required>
          <Select value={staffMemberId} onChange={(e) => setStaffMemberId(e.target.value)} options={staffOptions} />
        </Field>
        <Field label="Harakat" required>
          <Select
            value={action}
            onChange={(e) => setAction(e.target.value as AttendanceAction)}
            options={ATTENDANCE_ACTIONS.map((a) => ({ value: a, label: ATTENDANCE_ACTION_LABELS[a] }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kenglik">
            <NumberInput value={latitude} onChange={setLatitude} decimal placeholder="Kenglikni kiriting" />
          </Field>
          <Field label="Uzunlik">
            <NumberInput value={longitude} onChange={setLongitude} decimal placeholder="Uzunlikni kiriting" />
          </Field>
        </div>
        <Field label="Geofence">
          <Select value={geofenceId} onChange={(e) => setGeofenceId(e.target.value)} options={geofenceOptions} />
        </Field>
        <Field label="Qurilma ma‘lumotlari">
          <Input value={deviceInfo} onChange={(e) => setDeviceInfo(e.target.value)} placeholder="Qurilma ma‘lumotlarini kiriting" />
        </Field>

        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-negative">*</span>}
      </label>
      {children}
    </div>
  );
}
