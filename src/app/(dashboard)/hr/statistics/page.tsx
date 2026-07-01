"use client";

import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  MessagesSquare,
  Megaphone,
  Plane,
  UserCheck,
  UserPlus,
  UserSearch,
  Users,
} from "lucide-react";
import { useHrStats, type HrStatsOverview } from "@/lib/api/hr-stats";
import { Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function HrStatisticsPage() {
  const { data, isLoading, isError, refetch } = useHrStats();

  return (
    <div className="stagger">
      <PageHeader title="HR Statistika" subtitle="HR tahlillar va ko‘rsatkichlar" />

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError || !data ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-ink-muted">
          <span className="text-negative">Statistikani yuklashda xatolik</span>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
        </Card>
      ) : (
        <StatsContent data={data} />
      )}
    </div>
  );
}

function StatsContent({ data }: { data: HrStatsOverview }) {
  return (
    <div className="space-y-5">
      {/* Yuqori KPI kartalar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Jami xodimlar" value={data.staff.total} tone="neutral" />
        <KpiCard icon={UserCheck} label="Faol xodimlar" value={data.staff.active} tone="positive" />
        <KpiCard icon={Plane} label="Bugun ta‘tilda" value={data.staff.onLeaveToday} tone="caution" />
        <KpiCard icon={UserPlus} label="Oyda yangi qabul" value={data.staff.newThisMonth} tone="accent" />
      </div>

      {/* Davomat + Ishga qabul */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink">Davomat</h3>
          <div className="flex items-center gap-6">
            <Donut value={data.attendance.rate} />
            <div className="space-y-1.5 text-sm">
              <Metric label="Bugun ishda" value={data.attendance.presentToday} />
              <Metric label="Faol xodimlar" value={data.attendance.activeStaff} />
              <p className="pt-1 text-xs text-ink-muted">Davomat foizi bugungi kirishlar asosida</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink">Ishga qabul qilish</h3>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat icon={Megaphone} label="Ochiq vakansiyalar" value={data.recruitment.openVacancies} />
            <MiniStat icon={UserSearch} label="Faol nomzodlar" value={data.recruitment.activeCandidates} />
            <MiniStat icon={UserCheck} label="Oyda ishga olindi" value={data.recruitment.hiredThisMonth} />
          </div>
        </Card>
      </div>

      {/* Muloqotlar + Vazifalar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessagesSquare className="h-4 w-4 text-ink-muted" />
            <h3 className="text-sm font-semibold text-ink">Muloqotlar</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BigStat label="Jami" value={data.interactions.total} />
            <BigStat label="Tugatilgan muloqotlar" value={data.interactions.completed} tone="positive" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-ink-muted" />
            <h3 className="text-sm font-semibold text-ink">Vazifalar</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BigStat label="Jami" value={data.tasks.total} />
            <BigStat label="Bajarilgan" value={data.tasks.done} tone="positive" />
          </div>
        </Card>
      </div>
    </div>
  );
}

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-parchment-deep text-ink-soft",
  positive: "bg-positive/12 text-positive",
  caution: "bg-caution/14 text-caution",
  accent: "bg-amber/15 text-amber",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: keyof typeof TONE_CLASS;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONE_CLASS[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="tnum text-2xl font-semibold text-ink">{value}</div>
        <div className="text-sm text-ink-muted">{label}</div>
      </div>
    </Card>
  );
}

/** Davomat foizini ko'rsatuvchi SVG halqa (donut). */
function Donut({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-line" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          className="stroke-accent transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-xl font-semibold text-ink">{pct}%</span>
        <span className="text-[10px] text-ink-muted">Davomat foizi</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-ink-muted">{label}</span>
      <span className="tnum font-medium text-ink">{value}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-parchment/40 p-3 text-center">
      <Icon className="mx-auto mb-1.5 h-4 w-4 text-ink-muted" />
      <div className="tnum text-xl font-semibold text-ink">{value}</div>
      <div className="mt-0.5 text-xs leading-tight text-ink-muted">{label}</div>
    </div>
  );
}

function BigStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "positive";
}) {
  return (
    <div className="rounded-lg border border-line bg-parchment/40 p-4">
      <div className={`tnum text-2xl font-semibold ${tone === "positive" ? "text-positive" : "text-ink"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-sm text-ink-muted">{label}</div>
    </div>
  );
}
