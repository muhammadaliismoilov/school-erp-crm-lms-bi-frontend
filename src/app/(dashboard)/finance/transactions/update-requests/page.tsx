"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FileSearch,
  Search,
  X,
} from "lucide-react";
import {
  CHANGE_REQUEST_STATUS_LABELS,
  CHANGE_REQUEST_STATUS_TONE,
  CHANGE_REQUEST_TYPE_LABELS,
  PAGE_SIZES,
  useChangeRequests,
  useReviewChangeRequest,
  type ChangeRequest,
  type ChangeRequestStatus,
} from "@/lib/api/transaction-change-requests";
import { formatDateDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { Can } from "@/components/auth/can";

const STATUS_OPTIONS = [
  { value: "", label: "Barcha statuslar" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
];

const PROPOSED_FIELD_LABELS: Record<string, string> = {
  type: "Turi",
  amount: "Summa",
  date: "Sana",
  purposeCategoryId: "To‘lov maqsadi",
  paymentTypeId: "To‘lov turi",
  personId: "Shaxs",
  month: "Oy",
  year: "Yil",
  note: "Izoh",
};

export default function UpdateRequestsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ChangeRequestStatus>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [viewing, setViewing] = useState<ChangeRequest | null>(null);
  const [reviewing, setReviewing] = useState<{ req: ChangeRequest; action: "approved" | "rejected" } | null>(null);
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

  const { data, isLoading, isError, refetch } = useChangeRequests({
    page,
    limit,
    search,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="stagger">
      <PageHeader title="Tranzaksiya o‘zgartirish so‘rovlari" />

      {/* Filtrlar */}
      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="So‘rovlarni qidirish"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | ChangeRequestStatus);
            setPage(1);
          }}
        />
        <DatePicker
          value={dateFrom}
          onChange={(iso) => {
            setDateFrom(iso);
            setPage(1);
          }}
          placeholder="Sanadan"
        />
        <DatePicker
          value={dateTo}
          onChange={(iso) => {
            setDateTo(iso);
            setPage(1);
          }}
          placeholder="Sanagacha"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">Tranzaksiya</th>
                <th className="px-4 py-3 font-medium">So‘rov turi</th>
                <th className="px-4 py-3 font-medium">So‘ragan</th>
                <th className="px-4 py-3 font-medium">Sabab</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={8}>
                  <Spinner className="mx-auto h-5 w-5" />
                </StateRow>
              ) : isError ? (
                <StateRow colSpan={8}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={8}>
                  <div className="flex flex-col items-center gap-3 py-6 text-ink-muted">
                    <FileSearch className="h-10 w-10 opacity-50" />
                    <span>O‘zgartirish so‘rovlari topilmadi</span>
                  </div>
                </StateRow>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateDMY(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">
                        {r.txAmount != null ? formatMoney(r.txAmount) : "—"}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {r.txType === "income" ? "Kirim" : r.txType === "expense" ? "Chiqim" : "—"}
                        {r.txPersonName ? ` · ${r.txPersonName}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.requestType === "delete" ? "negative" : "accent"}>
                        {CHANGE_REQUEST_TYPE_LABELS[r.requestType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{r.requestedByName ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-ink-soft" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={CHANGE_REQUEST_STATUS_TONE[r.status]}>
                        {CHANGE_REQUEST_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-soft hover:bg-parchment hover:text-ink"
                          title="Ko‘rish"
                          onClick={() => setViewing(r)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {r.status === "pending" && (
                          <Can permission="transaction-change-requests.update">
                            <>
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => setReviewing({ req: r, action: "approved" })}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Tasdiqlash
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setReviewing({ req: r, action: "rejected" })}
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                Rad etish
                              </Button>
                            </>
                          </Can>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — har doim ko'rsatamiz (rasmdagidek "0 natija" ham) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-ink-muted">
            <span>Ko‘rsatilmoqda</span>
            <span className="tnum text-ink">
              {from} – {to}
            </span>
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
        </div>
      </div>

      <ViewModal request={viewing} onClose={() => setViewing(null)} />
      <ReviewModal
        data={reviewing}
        onClose={() => setReviewing(null)}
        onDone={(msg) => {
          setReviewing(null);
          setToast(msg);
        }}
      />

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

function ViewModal({ request, onClose }: { request: ChangeRequest | null; onClose: () => void }) {
  const changes = request?.proposedChanges ?? null;
  return (
    <Modal open={!!request} onClose={onClose} title="So‘rov tafsilotlari">
      {request && (
        <div className="space-y-4 text-sm">
          <Row label="So‘rov turi" value={CHANGE_REQUEST_TYPE_LABELS[request.requestType]} />
          <Row
            label="Tranzaksiya"
            value={`${request.txAmount != null ? formatMoney(request.txAmount) : "—"} · ${
              request.txType === "income" ? "Kirim" : request.txType === "expense" ? "Chiqim" : "—"
            }`}
          />
          <Row label="So‘ragan" value={request.requestedByName ?? "—"} />
          <Row label="Sabab" value={request.reason} />

          {request.requestType === "update" && changes && Object.keys(changes).length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-ink-muted">Taklif qilingan o‘zgarishlar</div>
              <div className="space-y-1 rounded-lg border border-line bg-parchment/40 p-3">
                {Object.entries(changes).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-ink-muted">{PROPOSED_FIELD_LABELS[k] ?? k}</span>
                    <span className="text-ink">
                      {k === "amount" ? formatMoney(Number(v)) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Row label="Holat" value={CHANGE_REQUEST_STATUS_LABELS[request.status]} />
          {request.reviewedByName && (
            <Row
              label="Ko‘rib chiqdi"
              value={`${request.reviewedByName}${
                request.reviewedAt ? ` · ${formatDateDMY(request.reviewedAt)}` : ""
              }`}
            />
          )}
          {request.reviewNote && <Row label="Izoh" value={request.reviewNote} />}
          {request.status === "approved" && (
            <Row label="Qo‘llandi" value={request.applied ? "Ha" : "Yo‘q (tranzaksiya topilmadi)"} />
          )}
        </div>
      )}
    </Modal>
  );
}

function ReviewModal({
  data,
  onClose,
  onDone,
}: {
  data: { req: ChangeRequest; action: "approved" | "rejected" } | null;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const review = useReviewChangeRequest();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNote("");
    setError(null);
  }, [data]);

  const isApprove = data?.action === "approved";

  async function submit() {
    if (!data) return;
    if (!isApprove && note.trim().length === 0) {
      setError("Rad etish sababini yozing");
      return;
    }
    try {
      await review.mutateAsync({
        id: data.req.id,
        input: { status: data.action, reviewNote: note.trim() || undefined },
      });
      onDone(isApprove ? "So‘rov tasdiqlandi va qo‘llandi" : "So‘rov rad etildi");
    } catch {
      setError("Amalni bajarishda xatolik yuz berdi");
    }
  }

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title={isApprove ? "So‘rovni tasdiqlash" : "So‘rovni rad etish"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant={isApprove ? "accent" : "danger"} onClick={submit} loading={review.isPending}>
            {isApprove ? "Tasdiqlash" : "Rad etish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          {isApprove
            ? "Tasdiqlansa, o‘zgarish tegishli tranzaksiyaga qo‘llanadi."
            : "Rad etilsa, tranzaksiya o‘zgarmaydi."}
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Izoh {isApprove ? "(ixtiyoriy)" : ""}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={isApprove ? "Tasdiq izohi" : "Rad etish sababi"}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-negative">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}
