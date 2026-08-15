"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ThumbsUp,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  GRADE_REQUEST_KIND_LABELS,
  GRADE_REQUEST_STATUS_LABELS,
  useDeleteGradeRequest,
  useGradeRequests,
  useReviewGradeRequest,
  type GradeRequest,
  type GradeRequestKind,
  type GradeRequestStatus,
} from "@/lib/api/grade-requests";
import { formatDateDMY } from "@/lib/format";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";
import { GradeRequestFormModal } from "@/components/academic/grade-request-form-modal";
import { useCrudPermissions } from "@/lib/auth/use-can";

const KIND_TABS: { value: GradeRequestKind; label: string }[] = [
  { value: "assessment", label: "Baholash" },
  { value: "course", label: "Kurs bahosi" },
  { value: "quarter", label: "Choraklik baho" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Barcha holatlar" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
];

const PAGE_SIZES = [10, 20, 50, 100];

const STATUS_TONE: Record<GradeRequestStatus, "positive" | "caution" | "negative"> = {
  approved: "positive",
  pending: "caution",
  rejected: "negative",
};

export default function GradeRequestsPage() {
  const { canCreate, canUpdate, canDelete, canMutate } = useCrudPermissions("grade-requests");

  const [kind, setKind] = useState<GradeRequestKind>("assessment");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | GradeRequestStatus>("");

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GradeRequest | null>(null);
  const [reviewing, setReviewing] = useState<{ req: GradeRequest; action: "approved" | "rejected" } | null>(null);
  const [deleting, setDeleting] = useState<GradeRequest | null>(null);

  const { data, isLoading, isError, refetch } = useGradeRequests({
    page,
    limit,
    kind,
    search: search || undefined,
    status: status || undefined,
  });
  const deleteRequest = useDeleteGradeRequest();

  const rows = data?.items ?? [];
  const stats = data?.stats;
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const hasFilters = search !== "" || status !== "";

  function resetToFirstPage() {
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  function switchKind(next: GradeRequestKind) {
    setKind(next);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteRequest.mutateAsync(deleting.id);
    setDeleting(null);
  }

  function gradeCell(r: GradeRequest) {
    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
    if (r.currentGrade != null) {
      return (
        <span className="tnum">
          <span className="text-ink-muted line-through">{fmt(r.currentGrade)}</span>{" "}
          <span className="text-ink-muted">→</span>{" "}
          <span className="font-semibold text-ink">{fmt(r.requestedGrade)}</span>
        </span>
      );
    }
    return <span className="tnum font-semibold text-ink">{fmt(r.requestedGrade)}</span>;
  }

  const statCards = useMemo(
    () => [
      { label: "Jami so‘rovlar", value: stats?.totalCount ?? "—", icon: <ClipboardList className="h-5 w-5" />, tone: "accent" as const },
      { label: "Kutilmoqda", value: stats?.pendingCount ?? "—", icon: <Clock className="h-5 w-5" />, tone: "amber" as const },
      { label: "Tasdiqlangan", value: stats?.approvedCount ?? "—", icon: <Check className="h-5 w-5" />, tone: "sky" as const },
      { label: "Rad etilgan", value: stats?.rejectedCount ?? "—", icon: <XCircle className="h-5 w-5" />, tone: "rose" as const },
    ],
    [stats],
  );

  return (
    <div className="stagger" onClick={() => menuFor && setMenuFor(null)}>
      <PageHeader
        title="Baho o‘zgartirish so‘rovi"
        subtitle="Baholash, kurs va choraklik baholarni o‘zgartirish so‘rovlarini ko‘rib chiqish"
      />

      {/* Turlar (tablar) */}
      <div className="mb-4 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {KIND_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => switchKind(tab.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              kind === tab.value ? "bg-accent text-accent-fg" : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Statistika */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
        ))}
      </div>

      {/* Filtrlar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            placeholder="So‘rovlarni qidirish"
            className="pl-9"
          />
        </div>

        <div className="w-52">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | GradeRequestStatus);
              resetToFirstPage();
            }}
          />
        </div>

        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" /> Tozalash
          </Button>
        )}

        <span className="ml-auto text-sm text-ink-muted">
          <span className="tnum text-ink">{total}</span> ta so‘rov
        </span>

        {canCreate && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> So‘rov yaratish
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
                <th className="label px-4 py-3 text-left">Sana</th>
                <th className="label px-4 py-3 text-left">O‘quvchi</th>
                <th className="label px-4 py-3 text-left">Fan</th>
                <th className="label px-4 py-3 text-left">Baho</th>
                <th className="label px-4 py-3 text-left">So‘rov sababi</th>
                <th className="label px-4 py-3 text-left">Holat</th>
                <th className="label px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="grid place-items-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <p className="mb-3 text-sm text-ink-muted">Ma'lumotni yuklab bo‘lmadi</p>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-parchment text-ink-muted">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-ink-muted">So‘rovlar topilmadi</p>
                  </td>
                </tr>
              )}

              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-parchment/50"
                >
                  <td className="px-4 py-3 tnum text-ink-muted">{from + i}</td>
                  <td className="px-4 py-3 tnum text-ink-soft">{formatDateDMY(r.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.studentName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.subjectName ?? "—"}</td>
                  <td className="px-4 py-3">{gradeCell(r)}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    <span className="line-clamp-2 max-w-[260px]">{r.reason}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status]}>{GRADE_REQUEST_STATUS_LABELS[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {canMutate && (
                      <div className="relative inline-block">
                        <button
                          onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                          aria-label="Amallar"
                          className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-parchment hover:text-ink"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuFor === r.id && (
                          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
                            {r.status === "pending" && canUpdate && (
                              <>
                                <button
                                  onClick={() => {
                                    setReviewing({ req: r, action: "approved" });
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-positive hover:bg-positive/8"
                                >
                                  <ThumbsUp className="h-4 w-4" /> Tasdiqlash
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewing({ req: r, action: "rejected" });
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-negative hover:bg-negative/8"
                                >
                                  <XCircle className="h-4 w-4" /> Rad etish
                                </button>
                                <button
                                  onClick={() => {
                                    setEditing(r);
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
                                >
                                  <Pencil className="h-4 w-4" /> Tahrirlash
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDeleting(r);
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-ink-muted">
              <span>Ko‘rinish:</span>
              <Select
                className="h-8 w-20 py-0"
                options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              />
              <span className="ml-2">
                <span className="tnum text-ink">
                  {from} – {to}
                </span>{" "}
                / <span className="tnum">{total}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tnum px-2 text-ink-muted">
                {page} / {pageCount}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage(pageCount)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Yaratish / Tahrirlash */}
      {(creating || editing) && (
        <GradeRequestFormModal
          open
          kind={kind}
          editing={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {/* Ko‘rib chiqish (tasdiq/rad) */}
      {reviewing && (
        <ReviewModal
          req={reviewing.req}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
        />
      )}

      {/* O‘chirish */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="So‘rovni o‘chirish"
        subtitle={deleting?.studentName ?? undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" loading={deleteRequest.isPending} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> O‘chirish
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Ushbu baho o‘zgartirish so‘rovi arxivlanadi. Kerak bo‘lsa keyinroq tiklash mumkin.
        </p>
      </Modal>
    </div>
  );
}

/** Tasdiqlash yoki rad etish modali. */
function ReviewModal({
  req,
  action,
  onClose,
}: {
  req: GradeRequest;
  action: "approved" | "rejected";
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const review = useReviewGradeRequest();
  const isReject = action === "rejected";

  async function submit() {
    if (isReject && note.trim().length < 3) return;
    await review.mutateAsync({
      id: req.id,
      input: { status: action, reviewNote: note.trim() || undefined },
    });
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isReject ? "So‘rovni rad etish" : "So‘rovni tasdiqlash"}
      subtitle={`${req.studentName ?? ""} · ${GRADE_REQUEST_KIND_LABELS[req.kind]}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            variant={isReject ? "danger" : "primary"}
            loading={review.isPending}
            disabled={isReject && note.trim().length < 3}
            onClick={submit}
          >
            {isReject ? <XCircle className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
            {isReject ? "Rad etish" : "Tasdiqlash"}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-line bg-parchment/40 p-3">
          <p className="text-ink-soft">{req.reason}</p>
          <p className="mt-2 text-ink-muted">
            Baho:{" "}
            <span className="tnum text-ink">
              {req.currentGrade != null ? `${req.currentGrade} → ` : ""}
              {req.requestedGrade}
            </span>
          </p>
        </div>
        {!isReject && !req.targetEntityId && (
          <p className="text-xs text-amber-600">
            Diqqat: bog‘langan baho yozuvi ko‘rsatilmagani uchun baho avtomatik yangilanmaydi.
          </p>
        )}
        <div>
          <label className="label mb-1 block">
            Izoh {isReject && <span className="text-negative">*</span>}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={isReject ? "Rad etish sababini yozing" : "Ixtiyoriy izoh"}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </div>
      </div>
    </Modal>
  );
}
