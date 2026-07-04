"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CalendarX,
  CheckCircle2,
  FileClock,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { formatMoneyShort, useDashboardOverview, type DashboardOverview } from "@/lib/api/dashboard";
import { AttendanceTrendChart, LeadFunnelChart, RevenueChart } from "@/components/dashboard/overview-charts";
import { API_TOTAL_ENDPOINTS } from "@/lib/api/manifest";
import { useAuthStore } from "@/lib/auth/store";
import { Card, Spinner } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Sana sarlavhasi ────────────────────────────────────────────────────────

const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function todayLabel(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Diqqat markazi lug'ati (key → yorliq/havola/ikonka) ────────────────────

const ACTION_DEFS: Record<string, { label: (n: number) => string; href: string; icon: typeof Users }> = {
  unconfirmed_sessions: {
    label: (n) => `${n} ta dars sessiyasi tasdiqlanmagan`,
    href: "/attendance",
    icon: CalendarX,
  },
  pending_payrolls: {
    label: (n) => `${n} ta oylik tasdiq kutmoqda`,
    href: "/hr/payroll",
    icon: Wallet,
  },
  debtors: {
    label: (n) => `${n} ta o'quvchida to'lov qarzi bor`,
    href: "/finance/debts",
    icon: Banknote,
  },
  stale_leads: {
    label: (n) => `${n} ta lid 48 soatdan beri javobsiz`,
    href: "/crm",
    icon: UserPlus,
  },
  expiring_certificates: {
    label: (n) => `${n} ta sertifikat muddati tugayapti (30 kun)`,
    href: "/hr/employees",
    icon: FileClock,
  },
};

// ─── Sahifa ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const can = useAuthStore((s) => s.can);
  const { data, isLoading } = useDashboardOverview();

  return (
    <div className="stagger space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{todayLabel()}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Boshqaruv paneli</h2>
        </div>
        {data?.attendanceToday && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Davomat jonli — har daqiqada yangilanadi
          </span>
        )}
      </div>

      {isLoading || !data ? (
        <KpiSkeleton />
      ) : (
        <>
          <KpiRow data={data} />

          <div className="grid gap-4 lg:grid-cols-3">
            {hasTodayPanel(data) ? (
              <TodayPanel data={data} className="lg:col-span-2" />
            ) : (
              <QuickActionsCard canFn={can} className="lg:col-span-2" />
            )}
            <ActionCenterCard items={data.actionCenter} />
          </div>

          <ChartsRow data={data} />

          {(data.branches || data.recentActivity) && (
            <div className="grid gap-4 lg:grid-cols-3">
              {data.branches && (
                <BranchComparisonCard
                  branches={data.branches}
                  className={data.recentActivity ? "lg:col-span-2" : "lg:col-span-3"}
                />
              )}
              {data.recentActivity && <RecentActivityCard items={data.recentActivity} />}
            </div>
          )}

          {hasTodayPanel(data) && <QuickActionsCard canFn={can} />}

          {data.isOwner && <SystemStatusCard />}
        </>
      )}
    </div>
  );
}

// ─── KPI qatori ─────────────────────────────────────────────────────────────

function KpiRow({ data }: { data: DashboardOverview }) {
  const cards: React.ReactNode[] = [];

  const revenue = data.revenue && (
    <KpiCard
      key="revenue"
      href="/finance/student-payments"
      icon={<Banknote className="h-5 w-5" />}
      label="Oy tushumi"
      value={formatMoneyShort(data.revenue.thisMonth)}
      delta={data.revenue.deltaPct}
      deltaHint="o'tgan oyga nisbatan"
      spark={data.revenue.spark}
    />
  );
  const debtors = data.debtors && (
    <KpiCard
      key="debtors"
      href="/finance/debts"
      icon={<TrendingDown className="h-5 w-5" />}
      label="Qarzdorlik"
      value={formatMoneyShort(data.debtors.amount)}
      sub={`${data.debtors.count} o'quvchi`}
      negative={data.debtors.count > 0}
    />
  );
  const payroll = data.payrollFund && (
    <KpiCard
      key="payroll"
      href="/hr/payroll"
      icon={<Wallet className="h-5 w-5" />}
      label="Oylik fondi (joriy oy)"
      value={formatMoneyShort(data.payrollFund.thisMonth)}
    />
  );
  const students = data.students && (
    <KpiCard
      key="students"
      href="/students"
      icon={<Users className="h-5 w-5" />}
      label="Faol o'quvchilar"
      value={String(data.students.active)}
      sub={data.students.newThisMonth > 0 ? `+${data.students.newThisMonth} shu oy` : undefined}
      spark={data.students.spark}
    />
  );
  const attendance = data.attendanceToday && (
    <KpiCard
      key="attendance"
      href="/attendance"
      icon={<GraduationCap className="h-5 w-5" />}
      label="Bugungi davomat"
      value={data.attendanceToday.ratePct !== null ? `${data.attendanceToday.ratePct}%` : "—"}
      sub={`${data.attendanceToday.present + data.attendanceToday.late}/${data.attendanceToday.totalActive} keldi${
        data.attendanceToday.late > 0 ? `, ${data.attendanceToday.late} kechikdi` : ""
      }`}
      ring={data.attendanceToday.ratePct}
    />
  );
  const leads = data.leads && (
    <KpiCard
      key="leads"
      href="/crm"
      icon={<UserPlus className="h-5 w-5" />}
      label="Yangi lidlar (hafta)"
      value={String(data.leads.newThisWeek)}
      delta={
        data.leads.prevWeek > 0
          ? Math.round(((data.leads.newThisWeek - data.leads.prevWeek) / data.leads.prevWeek) * 100)
          : null
      }
      deltaHint="o'tgan haftaga nisbatan"
      sub={data.leads.conversionRate !== null ? `konversiya ${data.leads.conversionRate}%` : undefined}
      spark={data.leads.spark}
    />
  );

  // Ega uchun pul birinchi; boshqalar uchun operatsion ko'rsatkichlar birinchi.
  const ordered = data.isOwner
    ? [revenue, payroll, debtors, students, leads, attendance]
    : [students, attendance, revenue, debtors, leads];
  for (const c of ordered) if (c) cards.push(c);

  return <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">{cards.slice(0, 5)}</div>;
}

function KpiCard({
  href,
  icon,
  label,
  value,
  sub,
  delta,
  deltaHint,
  spark,
  ring,
  negative,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  deltaHint?: string;
  spark?: number[];
  ring?: number | null;
  negative?: boolean;
}) {
  return (
    <Link href={href} className="group">
      <Card className="flex h-full flex-col p-4 transition-colors group-hover:border-amber">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
              negative ? "bg-rose-500/12 text-rose-500" : "bg-amber/15 text-amber",
            )}
          >
            {icon}
          </span>
          {delta !== undefined && delta !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                delta >= 0 ? "text-emerald-600" : "text-rose-500",
              )}
              title={deltaHint}
            >
              {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
          {ring !== undefined && ring !== null && <ProgressRing pct={ring} />}
        </div>
        <p className="mt-3 text-xs text-ink-muted">{label}</p>
        <p className="tnum mt-0.5 font-display text-2xl font-semibold text-ink">{value}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-ink-soft">{sub}</p>}
        {spark && spark.length > 1 && <Sparkline points={spark} className="mt-auto pt-2" />}
      </Card>
    </Link>
  );
}

/** Mini-trend chizig'i (kutubxonasiz, 1 ta polyline). */
function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 100;
  const h = 24;
  const max = Math.max(...points, 1);
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i * step},${h - (p / max) * (h - 2) - 1}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-6 w-full text-amber/70", className)} preserveAspectRatio="none">
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** Davomat foizi halqasi. */
function ProgressRing({ pct }: { pct: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const tone = pct >= 90 ? "text-emerald-500" : pct >= 75 ? "text-amber" : "text-rose-500";
  return (
    <svg viewBox="0 0 36 36" className={cn("h-9 w-9 -rotate-90", tone)}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
      <circle
        cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
      />
    </svg>
  );
}

// ─── BUGUN paneli (jonli operatsion holat) ──────────────────────────────────

function hasTodayPanel(data: DashboardOverview): boolean {
  return !!(data.attendanceToday || data.sessionsToday || data.paymentsToday);
}

function TodayPanel({ data, className }: { data: DashboardOverview; className?: string }) {
  const att = data.attendanceToday;
  const ses = data.sessionsToday;
  const pay = data.paymentsToday;
  const absent = data.absentPreview ?? [];

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Bugun</h3>
        <span className="text-xs text-ink-muted">{todayLabel()}</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {/* Davomat */}
        {att && (
          <Link href="/attendance" className="group rounded-xl border border-line bg-surface p-3.5 transition-colors hover:border-amber">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Davomat</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-ink-soft">Keldi</span><span className="tnum font-semibold text-emerald-600">{att.present + att.late}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">Kechikdi</span><span className="tnum font-semibold text-orange-600">{att.late}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">Kelmadi</span><span className="tnum font-semibold text-rose-500">{att.absent}</span></div>
            </div>
          </Link>
        )}

        {/* Darslar */}
        {ses && (
          <Link href="/attendance" className="group rounded-xl border border-line bg-surface p-3.5 transition-colors hover:border-amber">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Darslar</p>
            {ses.total === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Bugun dars rejalanmagan</p>
            ) : (
              <>
                <p className="tnum mt-2 text-xl font-semibold text-ink">
                  {ses.confirmed}/{ses.total} <span className="text-sm font-normal text-ink-muted">o'tildi</span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-parchment">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${ses.total > 0 ? (ses.confirmed / ses.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  {ses.pending > 0 && <span className="text-orange-600">{ses.pending} kutmoqda</span>}
                  {ses.pending > 0 && ses.cancelled > 0 && " · "}
                  {ses.cancelled > 0 && <span>{ses.cancelled} bekor</span>}
                </p>
              </>
            )}
          </Link>
        )}

        {/* To'lovlar */}
        {pay && (
          <Link href="/finance/student-payments" className="group rounded-xl border border-line bg-surface p-3.5 transition-colors hover:border-amber">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Bugungi to'lovlar</p>
            <p className="tnum mt-2 text-xl font-semibold text-ink">{formatMoneyShort(pay.amount)}</p>
            <p className="mt-1 text-xs text-ink-muted">{pay.count} ta to'lov qabul qilindi</p>
          </Link>
        )}
      </div>

      {/* Kelmaganlar ismlari (bor bo'lsa) */}
      {absent.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs text-ink-muted">Bugun kelmaganlar:</p>
          <div className="flex flex-wrap gap-1.5">
            {absent.map((name) => (
              <span key={name} className="rounded-full border border-rose-500/25 bg-rose-500/8 px-2.5 py-0.5 text-xs text-rose-600">
                {name}
              </span>
            ))}
            {att && att.absent > absent.length && (
              <Link href="/attendance" className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-muted hover:border-amber">
                +{att.absent - absent.length} yana →
              </Link>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Grafiklar qatori ───────────────────────────────────────────────────────

function ChartsRow({ data }: { data: DashboardOverview }) {
  const charts: React.ReactNode[] = [];
  if (data.revenue) charts.push(<RevenueChart key="rev" spark={data.revenue.spark} />);
  if (data.attendanceTrend) charts.push(<AttendanceTrendChart key="att" trend={data.attendanceTrend} />);
  if (data.leadFunnel) charts.push(<LeadFunnelChart key="fun" funnel={data.leadFunnel} />);
  if (charts.length === 0) return null;
  const cols = charts.length === 1 ? "lg:grid-cols-1" : charts.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return <div className={cn("grid gap-4", cols)}>{charts}</div>;
}

// ─── Diqqat markazi ─────────────────────────────────────────────────────────

function ActionCenterCard({ items }: { items: DashboardOverview["actionCenter"] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber" />
        <h3 className="font-display text-base font-semibold text-ink">Diqqat talab qiladi</h3>
      </div>
      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          <p className="text-sm font-medium text-ink">Hammasi nazoratda</p>
          <p className="text-xs text-ink-muted">Ochiq masalalar yo'q</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const def = ACTION_DEFS[item.key];
            if (!def) return null;
            const Icon = def.icon;
            return (
              <li key={item.key}>
                <Link
                  href={def.href}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm transition-colors hover:border-amber"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-500/12 text-orange-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-ink">{def.label(item.count)}</span>
                  <span className="text-ink-muted">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ─── Filiallar taqqoslash (faqat ega) ───────────────────────────────────────

function BranchComparisonCard({
  branches,
  className,
}: {
  branches: NonNullable<DashboardOverview["branches"]>;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <h3 className="font-display text-base font-semibold text-ink">Filiallar taqqoslash</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="py-2 pr-3 font-medium">Filial</th>
              <th className="py-2 pr-3 text-right font-medium">O'quvchi</th>
              <th className="py-2 pr-3 text-right font-medium">Tushum (oy)</th>
              <th className="py-2 pr-3 text-right font-medium">Davomat</th>
              <th className="py-2 text-right font-medium">Lid (hafta)</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id ?? "none"} className="border-b border-line/60 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-ink">{b.name}</td>
                <td className="tnum py-2.5 pr-3 text-right text-ink">{b.students}</td>
                <td className="tnum py-2.5 pr-3 text-right text-ink-soft">{formatMoneyShort(b.revenueThisMonth)}</td>
                <td className="tnum py-2.5 pr-3 text-right">
                  {b.attendancePct !== null ? (
                    <span
                      className={cn(
                        "font-medium",
                        b.attendancePct >= 90 ? "text-emerald-600" : b.attendancePct >= 75 ? "text-orange-600" : "text-rose-500",
                      )}
                    >
                      {b.attendancePct}%
                    </span>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
                <td className="tnum py-2.5 text-right text-ink-soft">{b.leadsWeek}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Oxirgi faoliyat (faqat ega) ────────────────────────────────────────────

const VERB_LABELS: Array<[RegExp, string]> = [
  [/^POST /, "yaratdi"],
  [/^PATCH |^PUT /, "yangiladi"],
  [/^DELETE /, "o'chirdi"],
];

const ENTITY_LABELS: Record<string, string> = {
  "crm/leads": "lid",
  lead: "lid",
  students: "o'quvchi",
  "hr/staff": "xodim",
  "hr/teachers": "o'qituvchi",
  "hr/payroll-runs": "oylik",
  "finance/student-payments": "to'lov",
};

function activityLine(item: { actor: string | null; action: string; entity: string }): string {
  const verb = VERB_LABELS.find(([re]) => re.test(item.action))?.[1];
  const entity = ENTITY_LABELS[item.entity] ?? item.entity;
  const actor = item.actor ?? "Tizim";
  return verb ? `${actor} ${entity} ${verb}` : `${actor}: ${item.action}`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daqiqa oldin`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}

function RecentActivityCard({ items }: { items: NonNullable<DashboardOverview["recentActivity"]> }) {
  return (
    <Card className="p-5">
      <h3 className="font-display text-base font-semibold text-ink">Oxirgi faoliyat</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Hozircha faoliyat yo'q</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.slice(0, 8).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
              <span className="min-w-0 flex-1">
                <span className="text-ink">{activityLine(item)}</span>
                <span className="ml-1.5 text-xs text-ink-muted">· {relativeTime(item.at)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─── Tezkor harakatlar ──────────────────────────────────────────────────────

function QuickActionsCard({ canFn, className }: { canFn: (p: string) => boolean; className?: string }) {
  const actions = [
    ["O'quvchi qo'shish", "/students", "students.manage"],
    ["Xodim qo'shish", "/hr/employees", "hr.manage"],
    ["To'lov kiritish", "/finance/student-payments", "finance.manage"],
    ["Lid qo'shish", "/crm", "crm.manage"],
    ["Oylik hisobi", "/hr/payroll", "hr.read"],
    ["Davomat taxtasi", "/attendance", "attendance.read"],
  ].filter(([, , perm]) => canFn(perm));

  return (
    <Card className={cn("p-5", className)}>
      <h3 className="font-display text-base font-semibold text-ink">Tezkor harakatlar</h3>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(([label, href]) => (
          <Link
            key={href + label}
            href={href}
            className="rounded-lg border border-line px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-amber hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ─── Tizim holati (faqat maktab egasi) ──────────────────────────────────────

function SystemStatusCard() {
  return (
    <Card className="bg-navy-texture p-5 text-paper">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold">Tizim holati</h3>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          {[
            ["API", "/api/v1"],
            ["Auth", "JWT + refresh"],
            ["Endpointlar", `${API_TOTAL_ENDPOINTS} ta`],
          ].map(([k, v]) => (
            <li key={k} className="flex items-center gap-2">
              <span className="text-paper/55">{k}</span>
              <span className="font-mono text-xs font-medium text-accent">{v}</span>
            </li>
          ))}
          <li>
            <a href="/explorer" className="text-sm font-semibold text-accent hover:underline">
              API Explorer →
            </a>
          </li>
        </ul>
      </div>
    </Card>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="h-36 animate-pulse p-4">
            <div className="h-9 w-9 rounded-lg bg-parchment" />
            <div className="mt-4 h-3 w-20 rounded bg-parchment" />
            <div className="mt-2 h-6 w-16 rounded bg-parchment" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="h-44 animate-pulse lg:col-span-2" />
        <Card className="grid h-44 place-items-center">
          <Spinner className="h-6 w-6" />
        </Card>
      </div>
    </>
  );
}
