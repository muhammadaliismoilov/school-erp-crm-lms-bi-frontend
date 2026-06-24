"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import {
  COMM_SENTIMENT_LABELS,
  PARENT_TYPE_LABELS,
  useDeleteParentComm,
  useParentComms,
  type CommSentiment,
  type ParentComm,
} from "@/lib/api/parent-comms";
import { useClassList } from "@/lib/api/classes";
import { useAuthStore } from "@/lib/auth/store";
import { formatDateTimeDMY } from "@/lib/format";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";
import { ParentCommFormModal } from "@/components/academic/parent-comm-form-modal";

const SENTIMENT_TABS: { value: "" | CommSentiment; label: string }[] = [
  { value: "", label: "Hammasi" },
  { value: "positive", label: "Ijobiy" },
  { value: "negative", label: "Salbiy" },
  { value: "neutral", label: "Neytral" },
];

const SENTIMENT_TONE: Record<CommSentiment, "positive" | "caution" | "negative"> = {
  positive: "positive",
  neutral: "caution",
  negative: "negative",
};

const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const PAGE_SIZES = [10, 20, 50, 100];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);

export default function ParentCommsPage() {
  const can = useAuthStore((s) => s.can);
  const canManage = can("students.manage");

  const [sentiment, setSentiment] = useState<"" | CommSentiment>("");
  const [classId, setClassId] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ParentComm | null>(null);
  const [deleting, setDeleting] = useState<ParentComm | null>(null);

  const { data, isLoading, isError, refetch } = useParentComms({
    page,
    limit,
    sentiment: sentiment || undefined,
    classId: classId || undefined,
    year: year ? Number(year) : undefined,
    month: month ? Number(month) : undefined,
  });
  const { data: classData } = useClassList();
  const deleteComm = useDeleteParentComm();

  const rows = data?.items ?? [];
  const stats = data?.stats;
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const hasFilters = sentiment !== "" || classId !== "" || year !== "" || month !== "";

  const classOptions = useMemo(() => {
    const items = classData?.items ?? [];
    return [
      { value: "", label: "Barcha sinflar" },
      ...[...items]
        .sort((a, b) => a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section))
        .map((c) => ({ value: c.id, label: `${c.gradeLevel}-${c.section}` })),
    ];
  }, [classData]);

  const yearOptions = [{ value: "", label: "Yil" }, ...YEARS.map((y) => ({ value: String(y), label: String(y) }))];
  const monthOptions = [
    { value: "", label: "Barcha oylar" },
    ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
  ];

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setSentiment("");
    setClassId("");
    setYear("");
    setMonth("");
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteComm.mutateAsync(deleting.id);
    setDeleting(null);
  }

  const statCards = [
    { label: "Jami muloqotlar", value: stats?.totalCount ?? "—", icon: <MessageSquare className="h-5 w-5" />, tone: "accent" as const },
    { label: "Ijobiy", value: stats?.positiveCount ?? "—", icon: <ThumbsUp className="h-5 w-5" />, tone: "sky" as const },
    { label: "Neytral", value: stats?.neutralCount ?? "—", icon: <Minus className="h-5 w-5" />, tone: "amber" as const },
    { label: "Salbiy", value: stats?.negativeCount ?? "—", icon: <ThumbsDown className="h-5 w-5" />, tone: "rose" as const },
  ];

  return (
    <div className="stagger" onClick={() => menuFor && setMenuFor(null)}>
      <PageHeader
        title="Ota-onalar bilan muloqot"
        subtitle="Xodimlarning ota-onalar bilan o‘tkazgan muloqotlari"
      />

      {/* Statistika */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
        ))}
      </div>

      {/* Filtrlar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          {SENTIMENT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSentiment(tab.value);
                resetPage();
              }}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                sentiment === tab.value ? "bg-accent text-accent-fg" : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-40">
          <Select
            options={classOptions}
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="w-28">
          <Select
            options={yearOptions}
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="w-40">
          <Select
            options={monthOptions}
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              resetPage();
            }}
          />
        </div>

        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" /> Filtrlarni tozalash
          </Button>
        )}

        {canManage && (
          <Button size="sm" className="ml-auto" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Muloqot qo‘shish
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
                <th className="label px-4 py-3 text-left">Xodim</th>
                <th className="label px-4 py-3 text-left">Guruh</th>
                <th className="label px-4 py-3 text-left">Ota-ona</th>
                <th className="label px-4 py-3 text-left">Ota-ona turi</th>
                <th className="label px-4 py-3 text-left">Ota-ona munosabati</th>
                <th className="label px-4 py-3 text-left">Izohlar</th>
                <th className="label px-4 py-3 text-left">Muloqot sanasi</th>
                <th className="label px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-16">
                    <div className="grid place-items-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <p className="mb-3 text-sm text-ink-muted">Ma'lumotni yuklab bo‘lmadi</p>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-parchment text-ink-muted">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-ink-muted">Muloqotlar topilmadi</p>
                  </td>
                </tr>
              )}

              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-parchment/50"
                >
                  <td className="px-4 py-3 tnum text-ink-muted">{from + i}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.staffName ?? "—"}</div>
                    {r.studentName && <div className="text-xs text-ink-muted">{r.studentName}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {r.className ? <Badge tone="neutral">{r.className}</Badge> : <span className="text-ink-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.parentName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{PARENT_TYPE_LABELS[r.parentType]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={SENTIMENT_TONE[r.sentiment]}>{COMM_SENTIMENT_LABELS[r.sentiment]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {r.notes ? <span className="line-clamp-2 max-w-[220px]">{r.notes}</span> : <span className="text-ink-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 tnum text-ink-soft">{formatDateTimeDMY(r.communicationDate)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <div className="relative inline-block">
                        <button
                          onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                          aria-label="Amallar"
                          className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-parchment hover:text-ink"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuFor === r.id && (
                          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
                            <button
                              onClick={() => {
                                setEditing(r);
                                setMenuFor(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
                            >
                              <Pencil className="h-4 w-4" /> Tahrirlash
                            </button>
                            <button
                              onClick={() => {
                                setDeleting(r);
                                setMenuFor(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-negative hover:bg-negative/8"
                            >
                              <Trash2 className="h-4 w-4" /> O‘chirish
                            </button>
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
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tnum px-2 text-ink-muted">
                {page} / {pageCount}
              </span>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(pageCount)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Yaratish / Tahrirlash */}
      {(creating || editing) && (
        <ParentCommFormModal
          open
          editing={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {/* O‘chirish */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Muloqotni o‘chirish"
        subtitle={deleting?.studentName ?? undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" loading={deleteComm.isPending} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> O‘chirish
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">Ushbu muloqot qaydi arxivlanadi.</p>
      </Modal>
    </div>
  );
}
