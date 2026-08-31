"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  LayoutGrid,
  Minus,
  Search,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useClassList } from "@/lib/api/classes";
import {
  RATING_TREND_LABELS,
  useRatingClasses,
  useRatingLeaders,
  useRatingList,
  useRatingSubjects,
  type RatingTrend,
} from "@/lib/api/students-rating";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Spinner } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/students/stat-card";
import { RatingPodium } from "@/components/academic/rating-podium";
import { RatingStudentModal } from "@/components/academic/rating-student-modal";
import { cn } from "@/lib/utils";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

const TABS = [
  { key: "leaders", label: "Liderlar", icon: Trophy },
  { key: "table", label: "Jadval", icon: LayoutGrid },
  { key: "classes", label: "Sinflar", icon: BarChart3 },
  { key: "subjects", label: "Fanlar", icon: BookOpen },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const PAGE_SIZES = [10, 20, 50, 100] as const;

export default function RatingPage() {
  const { t } = useI18n();

  const [tab, setTab] = useState<TabKey>("leaders");
  const [gradeLevel, setGradeLevel] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const searchQuery = useDebouncedSearch(search);
  // Qidiruv o'zgarsa birinchi sahifaga qaytamiz. Reset DEBOUNCELANGAN qiymatga
  // bog'langan: harf bosilganda qaytarsak, kutish tugashidan oldin eski qidiruv
  // bilan ortiqcha so'rov ketardi (foydalanuvchi 1-sahifada bo'lmasa).
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [leaderLimit, setLeaderLimit] = useState<10 | 20>(10);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const classesAll = useClassList();
  const scope = useMemo(
    () => ({
      gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
      classId: classId || undefined,
    }),
    [gradeLevel, classId],
  );

  const listQuery = useRatingList({ ...scope, search: searchQuery, page, limit });
  const leadersQuery = useRatingLeaders({ ...scope, limit: leaderLimit });
  const classesQuery = useRatingClasses({ gradeLevel: scope.gradeLevel });
  const subjectsQuery = useRatingSubjects(scope);

  const stats = listQuery.data?.stats;
  const total = listQuery.data?.meta.total ?? 0;
  const pageCount = listQuery.data?.meta.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Filtr variantlari
  const gradeOptions = useMemo(() => {
    const levels = new Set<number>();
    for (const c of classesAll.data?.items ?? []) levels.add(c.gradeLevel);
    return [...levels]
      .sort((a, b) => a - b)
      .map((g) => ({ value: String(g), label: `${g}-sinf` }));
  }, [classesAll.data]);

  const classOptions = useMemo(() => {
    const items = (classesAll.data?.items ?? []).filter(
      (c) => !gradeLevel || c.gradeLevel === Number(gradeLevel),
    );
    return items.map((c) => ({ value: c.id, label: c.name }));
  }, [classesAll.data, gradeLevel]);

  const resetPage = () => setPage(1);

  return (
    <div className="stagger">
      <PageHeader title={t("nav.ac.rating")} subtitle="Baholar va davomat asosida o‘quvchilar reytingi" />

      {/* Stat kartalar */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Jami o‘quvchi"
          value={stats?.jamiOquvchi ?? "—"}
          hint="Tanlangan sinf"
          icon={<Users className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="O‘rtacha umumiy ball"
          value={stats?.ortachaUmumiyBall ?? "—"}
          hint="Ball + davomat (0–25)"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label="O‘sish trendi"
          value={stats ? `${stats.osishTrendi}%` : "—"}
          hint="Reytingi o‘smoqda"
          icon={<Trophy className="h-5 w-5" />}
          tone="sky"
        />
      </div>

      {/* Filtrlar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-32">
          <Select
            value={gradeLevel}
            onChange={(e) => {
              setGradeLevel(e.target.value);
              setClassId("");
              resetPage();
            }}
            options={[{ value: "", label: "Barcha sinflar" }, ...gradeOptions]}
          />
        </div>
        <div className="w-28">
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              resetPage();
            }}
            options={[{ value: "", label: "Barchasi" }, ...classOptions]}
          />
        </div>
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism bo‘yicha qidirish…"
            className="pl-9"
          />
        </div>
        <span className="ml-auto text-sm text-ink-muted tnum">{total} o‘quvchi</span>
      </div>

      {/* Tablar */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-line bg-parchment/50 p-1 sm:grid-cols-4">
        {TABS.map((tabItem) => {
          const Icon = tabItem.icon;
          const active = tab === tabItem.key;
          return (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" />
              {tabItem.label}
            </button>
          );
        })}
      </div>

      {/* Kontent */}
      <div className="card p-5">
        {tab === "leaders" && (
          <LeadersTab
            query={leadersQuery}
            leaderLimit={leaderLimit}
            onLimit={setLeaderLimit}
            onSelect={setSelectedStudent}
          />
        )}
        {tab === "table" && (
          <RatingTable query={listQuery} onSelect={setSelectedStudent} />
        )}
        {tab === "classes" && <ClassesTab query={classesQuery} />}
        {tab === "subjects" && <SubjectsTab query={subjectsQuery} />}
      </div>

      {/* Pagination (faqat Jadval) */}
      {tab === "table" && total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span>
              {from}–{to} / {total}
            </span>
            <div className="w-20">
              <Select
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  resetPage();
                }}
                options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Oldingi
            </button>
            <span className="text-sm text-ink-muted tnum">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
            >
              Keyingi
            </button>
          </div>
        </div>
      )}

      <RatingStudentModal studentId={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Liderlar tab
// ---------------------------------------------------------------------------

function LeadersTab({
  query,
  leaderLimit,
  onLimit,
  onSelect,
}: {
  query: ReturnType<typeof useRatingLeaders>;
  leaderLimit: 10 | 20;
  onLimit: (v: 10 | 20) => void;
  onSelect: (id: string) => void;
}) {
  if (query.isLoading || !query.data) return <Loader />;
  const { podium, leaders } = query.data;

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-1">
        {([10, 20] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onLimit(v)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              leaderLimit === v ? "bg-accent/15 text-accent" : "bg-parchment/70 text-ink-muted hover:text-ink",
            )}
          >
            Top {v}
          </button>
        ))}
      </div>

      <RatingPodium podium={podium} onSelect={onSelect} />

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Top {leaderLimit} ro‘yxat
        </h4>
        {leaders.length === 0 ? (
          <Empty />
        ) : (
          <div className="divide-y divide-line/70">
            {leaders.map((leader) => (
              <button
                key={leader.studentId}
                type="button"
                onClick={() => onSelect(leader.studentId)}
                className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-parchment/50"
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold tnum",
                    leader.rank === 1
                      ? "bg-amber/20 text-amber"
                      : leader.rank === 2
                        ? "bg-slate-400/20 text-slate-500"
                        : leader.rank === 3
                          ? "bg-orange-700/20 text-orange-700"
                          : "bg-parchment-deep text-ink-muted",
                  )}
                >
                  {leader.rank}
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/12 text-xs font-semibold text-accent">
                  {leader.initials ?? "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{leader.studentName}</span>
                  <span className="block text-xs text-ink-muted">
                    {leader.classLabel ?? "—"} · {RATING_TREND_LABELS[leader.trend]}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-lg font-semibold text-accent tnum">{leader.umumiyBall}</span>
                  <span className="block text-[11px] text-ink-muted">umumiy ball</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Jadval tab
// ---------------------------------------------------------------------------

function RatingTable({
  query,
  onSelect,
}: {
  query: ReturnType<typeof useRatingList>;
  onSelect: (id: string) => void;
}) {
  if (query.isLoading || !query.data) return <Loader />;
  const items = query.data.items;
  const offset = (query.data.meta.page - 1) * query.data.meta.limit;

  if (items.length === 0) return <Empty />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-2 py-2 font-medium">#</th>
            <th className="px-2 py-2 font-medium">Ism</th>
            <th className="px-2 py-2 font-medium">Sinf</th>
            <th className="px-2 py-2 text-right font-medium">Umumiy</th>
            <th className="px-2 py-2 text-right font-medium">Ball</th>
            <th className="px-2 py-2 text-right font-medium">Davomat</th>
            <th className="px-2 py-2 text-center font-medium">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {items.map((row, i) => (
            <tr
              key={row.studentId}
              onClick={() => onSelect(row.studentId)}
              className="cursor-pointer hover:bg-parchment/50"
            >
              <td className="px-2 py-2.5 text-ink-muted tnum">{offset + i + 1}</td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/12 text-[11px] font-semibold text-accent">
                    {row.initials ?? "—"}
                  </span>
                  <span className="font-medium text-ink">{row.studentName}</span>
                </div>
              </td>
              <td className="px-2 py-2.5">
                <Badge tone="neutral">{row.classLabel ?? "—"}</Badge>
              </td>
              <td className="px-2 py-2.5 text-right font-semibold text-accent tnum">{row.umumiyBall}</td>
              <td className="px-2 py-2.5 text-right text-ink tnum">{row.ortachaBall}</td>
              <td className="px-2 py-2.5 text-right tnum">
                <span className={davomatTone(row.davomat)}>{row.davomat}%</span>
              </td>
              <td className="px-2 py-2.5 text-center">
                <TrendCell trend={row.trend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendCell({ trend }: { trend: RatingTrend }) {
  if (trend === "rising") return <ArrowUp className="mx-auto h-4 w-4 text-positive" aria-label={RATING_TREND_LABELS.rising} />;
  if (trend === "falling") return <ArrowDown className="mx-auto h-4 w-4 text-negative" aria-label={RATING_TREND_LABELS.falling} />;
  return <Minus className="mx-auto h-4 w-4 text-ink-muted/50" aria-label={RATING_TREND_LABELS.stable} />;
}

function davomatTone(pct: number): string {
  if (pct >= 90) return "text-positive";
  if (pct >= 75) return "text-amber";
  return "text-negative";
}

// ---------------------------------------------------------------------------
// Sinflar tab
// ---------------------------------------------------------------------------

function ClassesTab({ query }: { query: ReturnType<typeof useRatingClasses> }) {
  if (query.isLoading || !query.data) return <Loader />;
  const data = query.data;
  if (data.length === 0) return <Empty />;

  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Sinflar o‘rtacha umumiy ball
      </h4>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-line" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-muted" />
            <YAxis type="category" dataKey="classLabel" tick={{ fontSize: 12 }} width={48} stroke="currentColor" className="text-ink-muted" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="avgUmumiyBall" radius={[0, 6, 6, 0]} fill="var(--color-accent, #16a34a)" barSize={22}>
              <LabelList dataKey="avgUmumiyBall" position="right" className="fill-ink text-xs" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fanlar tab
// ---------------------------------------------------------------------------

const SUBJECT_COLORS = ["#16a34a", "#0284c7", "#7c3aed", "#d97706", "#db2777", "#0891b2"];

function SubjectsTab({ query }: { query: ReturnType<typeof useRatingSubjects> }) {
  if (query.isLoading || !query.data) return <Loader />;
  const data = query.data;
  if (data.length === 0) return <Empty />;

  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Fanlar o‘rtacha choraklik baho
      </h4>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -16, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-line" vertical={false} />
            <XAxis dataKey="subjectName" tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-muted" interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-muted" allowDecimals />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="avgBall" radius={[6, 6, 0, 0]} barSize={36}>
              {data.map((_, i) => (
                <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
              ))}
              <LabelList dataKey="avgBall" position="top" className="fill-ink text-xs" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Yordamchilar
// ---------------------------------------------------------------------------

function Loader() {
  return (
    <div className="grid place-items-center py-16">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

function Empty() {
  return (
    <div className="grid place-items-center py-16 text-center">
      <Trophy className="mb-3 h-9 w-9 text-ink-muted/50" />
      <p className="text-sm text-ink-muted">Ma'lumot yo'q</p>
    </div>
  );
}
