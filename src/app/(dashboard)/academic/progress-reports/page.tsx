"use client";

import { useMemo, useState } from "react";
import { Award, FileDown, Maximize2, Star, TrendingUp, Users, XCircle } from "lucide-react";
import { useClasses, useQuarters, useSubjects } from "@/lib/api/academic";
import {
  gradeColorClass,
  useAverageReport,
  useProgressExamReport,
  useQuarterlyReport,
  type AverageReport,
  type ProgressExamReport,
  type QuarterlyReport,
} from "@/lib/api/progress-reports";
import { useI18n } from "@/lib/i18n/provider";
import { Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/students/stat-card";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "average", label: "O‘rtacha o‘zlashtirish ko‘rsatkichlari" },
  { key: "quarterly", label: "Choraklik ko‘rsatkichlari" },
  { key: "progress", label: "Progress imtihon ko‘rsatkichlari" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const PAGE_SIZES = [10, 20, 50, 100] as const;

export default function ProgressReportsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabKey>("average");

  const classes = useClasses();
  const subjects = useSubjects();
  const quarters = useQuarters();

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [wide, setWide] = useState(false);

  const params = {
    classId: classId || undefined,
    subjectId: subjectId || undefined,
    quarterId: quarterId || undefined,
    page,
    limit,
  };
  // classId bo'sh bo'lsa — "Barcha sinflar" (backend barcha aktiv o'quvchini oladi).
  const avg = useAverageReport({ classId: classId || undefined, quarterId: quarterId || undefined, page, limit }, tab === "average");
  const qtr = useQuarterlyReport(params, tab === "quarterly");
  const prog = useProgressExamReport(params, tab === "progress");

  const active = tab === "average" ? avg : tab === "quarterly" ? qtr : prog;
  const meta = active.data?.meta;

  const classOptions = useMemo(
    () => [{ value: "", label: "Barcha sinflar" }, ...(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))],
    [classes.data],
  );
  const subjectOptions = useMemo(
    () => [{ value: "", label: "Hamma fan" }, ...(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name }))],
    [subjects.data],
  );
  const quarterOptions = useMemo(
    () => [
      { value: "", label: "Hammasi" },
      ...(quarters.data ?? []).map((q) => ({ value: q.id, label: q.name?.uz ?? `${q.quarterNumber}-chorak` })),
    ],
    [quarters.data],
  );

  const reset = () => setPage(1);

  return (
    <div className="stagger">
      <PageHeader title={t("nav.ac.progressReports")} subtitle="Sinf bo‘yicha o‘zlashtirish va imtihon ko‘rsatkichlari" />

      {/* Tab kapsulalari */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => {
              setTab(tabItem.key);
              reset();
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === tabItem.key ? "bg-accent text-white" : "bg-parchment/60 text-ink-muted hover:text-ink",
            )}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Filtrlar + PDF */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Select value={classId} onChange={(e) => { setClassId(e.target.value); reset(); }} options={classOptions} />
        </div>
        {(tab === "quarterly" || tab === "progress") && (
          <div className="w-44">
            <Select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); reset(); }} options={subjectOptions} />
          </div>
        )}
        <div className="w-36">
          <Select value={quarterId} onChange={(e) => { setQuarterId(e.target.value); reset(); }} options={quarterOptions} />
        </div>
        {tab === "quarterly" && (
          <Button variant="ghost" size="sm" onClick={() => setWide((w) => !w)}>
            <Maximize2 className="h-4 w-4" /> Kattalashtirish
          </Button>
        )}
        <Button variant="secondary" size="sm" className="ml-auto" onClick={() => window.print()}>
          <FileDown className="h-4 w-4" /> PDF
        </Button>
      </div>

      {active.isLoading || !active.data ? (
        <Loader />
      ) : (
        <>
          {tab === "average" && <AverageReportView data={avg.data as AverageReport} page={page} limit={limit} />}
          {tab === "quarterly" && <QuarterlyReportView data={qtr.data as QuarterlyReport} page={page} limit={limit} wide={wide} />}
          {tab === "progress" && <ProgressExamView data={prog.data as ProgressExamReport} page={page} limit={limit} />}

          {meta && (
            <Pagination
              page={page}
              limit={limit}
              pageCount={meta.pageCount}
              total={meta.total}
              onPage={setPage}
              onLimit={(l) => { setLimit(l); reset(); }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — O'rtacha o'zlashtirish
// ---------------------------------------------------------------------------

function AverageReportView({ data, page, limit }: { data: AverageReport; page: number; limit: number }) {
  const { subjects, rows, footer, stats } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Jami o‘quvchilar" value={stats.jamiOquvchilar} icon={<Users className="h-5 w-5" />} tone="accent" />
        <StatCard label="O‘rtacha baho" value={fmt(stats.ortachaBaho)} icon={<TrendingUp className="h-5 w-5" />} tone="violet" />
        <StatCard label="A‘lochilar" value={`${stats.alochilar} (${stats.alochilarPercent}%)`} icon={<Award className="h-5 w-5" />} tone="sky" />
        <StatCard label="Yaxshi o‘quvchilar" value={`${stats.yaxshi} (${stats.yaxshiPercent}%)`} icon={<Star className="h-5 w-5" />} tone="amber" />
        <StatCard label="Qoniqarsiz" value={`${stats.qoniqarsiz} (${stats.qoniqarsizPercent}%)`} icon={<XCircle className="h-5 w-5" />} tone="rose" />
      </div>

      {rows.length === 0 ? (
        <NoData />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-accent/10 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2.5 font-medium">№</th>
                <th className="px-3 py-2.5 font-medium">O‘quvchilar</th>
                {subjects.map((s) => (
                  <th key={s.id} className="px-3 py-2.5 text-center font-medium">{s.name}</th>
                ))}
                <th className="px-3 py-2.5 text-center font-medium">O‘rtacha o‘zlashtirish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows.map((row, i) => (
                <tr key={row.student.id} className="hover:bg-parchment/40">
                  <td className="px-3 py-2.5 text-ink-muted tnum">{(page - 1) * limit + i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-ink">{row.student.name}</td>
                  {subjects.map((s) => (
                    <td key={s.id} className="px-3 py-2.5 text-center">
                      <GradeChip value={row.grades[s.id] ?? null} />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center">
                    <GradeChip value={row.average} strong />
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-line bg-parchment/50 font-semibold">
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-ink">Sinf o‘rtachasi</td>
                {subjects.map((s) => (
                  <td key={s.id} className="px-3 py-2.5 text-center text-ink tnum">{fmt(footer.subjectAverages[s.id] ?? null)}</td>
                ))}
                <td className="px-3 py-2.5 text-center">
                  <GradeChip value={footer.overall} strong />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Choraklik
// ---------------------------------------------------------------------------

function QuarterlyReportView({
  data,
  page,
  limit,
  wide,
}: {
  data: QuarterlyReport;
  page: number;
  limit: number;
  wide: boolean;
}) {
  const { subjects, quarters, rows } = data;
  if (rows.length === 0) return <NoData />;

  return (
    <div className={cn("card overflow-x-auto p-0", wide ? "text-[13px]" : "text-sm")}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-line bg-accent/10 text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-3 py-2.5 text-left font-medium" rowSpan={2}>№</th>
            <th className="px-3 py-2.5 text-left font-medium" rowSpan={2}>O‘quvchilar</th>
            {subjects.map((s) => (
              <th key={s.id} className="border-l border-line px-3 py-1.5 text-center font-medium" colSpan={quarters.length}>
                {s.name}
              </th>
            ))}
          </tr>
          <tr className="border-b border-line bg-accent/5 text-[11px] text-ink-muted">
            {subjects.map((s) =>
              quarters.map((q) => (
                <th key={`${s.id}-${q.id}`} className="border-l border-line px-2 py-1 text-center font-normal">
                  {q.quarterNumber}-ch
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {rows.map((row, i) => (
            <tr key={row.student.id} className="hover:bg-parchment/40">
              <td className="px-3 py-2.5 text-ink-muted tnum">{(page - 1) * limit + i + 1}</td>
              <td className="px-3 py-2.5 font-medium text-ink">{row.student.name}</td>
              {subjects.map((s) =>
                quarters.map((q) => (
                  <td key={`${s.id}-${q.id}`} className="border-l border-line px-2 py-2 text-center">
                    <GradeChip value={row.cells[s.id]?.[q.id] ?? null} />
                  </td>
                )),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Progress imtihon
// ---------------------------------------------------------------------------

function ProgressExamView({ data, page, limit }: { data: ProgressExamReport; page: number; limit: number }) {
  const { rows, stats } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Jami o‘quvchilar" value={stats.jamiOquvchilar} icon={<Users className="h-5 w-5" />} tone="accent" />
        <StatCard label="Sinf o‘rtacha bahosi" value={fmt(stats.sinfOrtachaBaho)} icon={<TrendingUp className="h-5 w-5" />} tone="violet" />
        <StatCard label="Sinf o‘rtacha balli" value={fmt(stats.sinfOrtachaBall)} icon={<Award className="h-5 w-5" />} tone="sky" />
      </div>

      {rows.length === 0 ? (
        <NoData />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-accent/10 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2.5 font-medium">№</th>
                <th className="px-3 py-2.5 font-medium">O‘quvchilar</th>
                <th className="px-3 py-2.5 text-center font-medium">O‘rtacha baho</th>
                <th className="px-3 py-2.5 text-center font-medium">O‘rtacha ball</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows.map((row, i) => (
                <tr key={row.student.id} className="hover:bg-parchment/40">
                  <td className="px-3 py-2.5 text-ink-muted tnum">{(page - 1) * limit + i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-ink">{row.student.name}</td>
                  <td className="px-3 py-2.5 text-center text-ink tnum">{fmt(row.avgBaho)}</td>
                  <td className="px-3 py-2.5 text-center text-ink tnum">{fmt(row.avgBall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Umumiy komponentlar
// ---------------------------------------------------------------------------

function GradeChip({ value, strong }: { value: number | null; strong?: boolean }) {
  return (
    <span
      className={cn(
        "inline-grid h-7 min-w-[2rem] place-items-center rounded-full px-2 text-xs font-semibold tnum",
        gradeColorClass(value),
        strong && "min-w-[2.5rem] text-sm",
      )}
    >
      {value === null ? "—" : value}
    </span>
  );
}

function Pagination({
  page,
  limit,
  pageCount,
  total,
  onPage,
  onLimit,
}: {
  page: number;
  limit: number;
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <span className="tnum">{from}–{to} / {total}</span>
        <div className="w-20">
          <Select
            value={String(limit)}
            onChange={(e) => onLimit(Number(e.target.value))}
            options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink disabled:opacity-40"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Oldingi
        </button>
        <span className="text-sm text-ink-muted tnum">{page} / {pageCount}</span>
        <button
          type="button"
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink disabled:opacity-40"
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
        >
          Keyingi
        </button>
      </div>
    </div>
  );
}

function fmt(value: number | null): string {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

function Loader() {
  return (
    <div className="grid place-items-center py-16">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

function NoData() {
  return (
    <div className="card grid place-items-center border-dashed py-16 text-center">
      <p className="text-sm text-ink-muted">Ma'lumot topilmadi</p>
    </div>
  );
}
