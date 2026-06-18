"use client";

import { useMemo, useState } from "react";
import { Activity, Clock, TrendingUp, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, Spinner } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/api/crm";
import { useLeadStats } from "@/lib/api/crm-stats";
import {
  BarList,
  Donut,
  EmptyChart,
  Funnel,
  Heatmap,
  KpiCard,
  STATUS_COLOR,
  TrendLine,
  fmtInt,
  fmtPct,
} from "@/components/crm/stats-charts";

const PRESETS = ["today", "week", "month", "year", "all"] as const;
type Preset = (typeof PRESETS)[number];

const TABS = ["overview", "funnel", "sources", "managers", "segments"] as const;
type Tab = (typeof TABS)[number];

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Map a preset to an inclusive [from, to] ISO date-time range (ends today). */
function presetRange(preset: Preset): { from?: string; to?: string } {
  if (preset === "all") return {};
  const today = new Date();
  const to = `${isoDay(today)}T23:59:59`;
  const f = new Date(today);
  if (preset === "today") return { from: `${isoDay(today)}T00:00:00`, to };
  if (preset === "week") {
    f.setDate(f.getDate() - ((today.getDay() + 6) % 7));
  } else if (preset === "month") {
    f.setMonth(f.getMonth(), 1);
  } else {
    f.setMonth(0, 1); // year
  }
  return { from: `${isoDay(f)}T00:00:00`, to };
}

export default function CrmStatsPage() {
  const { t } = useI18n();
  const [preset, setPreset] = useState<Preset>("month");
  const [tab, setTab] = useState<Tab>("overview");

  const range = useMemo(() => presetRange(preset), [preset]);
  const { data, isLoading, isError } = useLeadStats(range);

  const statusLabel = (s: string) => (s === "enrolled" ? t("crm.statistics.enrolled") : t(`crm.status.${s}`));
  const days = (n: number | null) => (n === null ? "—" : `${n} ${t("crm.statistics.days")}`);
  const hours = (n: number | null) => (n === null ? "—" : `${n} ${t("crm.statistics.hours")}`);

  return (
    <div className="stagger">
      <PageHeader title={t("crm.statistics.title")} subtitle={t("crm.statistics.subtitle")} />

      {/* toolbar: tabs + date presets */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-lg border border-line bg-surface p-1">
          {TABS.map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={`h-8 rounded-md px-3 text-sm font-medium ${tab === tb ? "bg-accent text-accent-fg" : "text-ink-soft"}`}
            >
              {t(`crm.statistics.tab.${tb}`)}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-line bg-surface p-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`h-8 rounded-md px-3 text-sm font-medium ${preset === p ? "bg-accent text-accent-fg" : "text-ink-soft"}`}
            >
              {t(`crm.statistics.preset.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <Card className="grid h-64 place-items-center">
          <Spinner />
        </Card>
      )}
      {isError && (
        <Card className="grid h-40 place-items-center text-sm text-ink-muted">{t("crm.statistics.error")}</Card>
      )}

      {data && tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={t("crm.statistics.kpi.total")} value={fmtInt(data.overview.totalLeads)} icon={<Users size={18} />} />
            <KpiCard
              label={t("crm.statistics.kpi.new")}
              value={fmtInt(data.overview.newLeads)}
              delta={data.overview.newLeadsDelta}
              icon={<UserPlus size={18} />}
            />
            <KpiCard
              label={t("crm.statistics.kpi.conversion")}
              value={fmtPct(data.overview.conversionRate)}
              delta={data.overview.conversionRateDelta}
              icon={<TrendingUp size={18} />}
            />
            <KpiCard label={t("crm.statistics.kpi.cycle")} value={days(data.overview.avgCycleDays)} icon={<Clock size={18} />} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-3 text-sm font-medium text-ink-soft">{t("crm.statistics.trendTitle")}</h3>
              <TrendLine data={data.overview.trend} />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-medium text-ink-soft">{t("crm.statistics.statusTitle")}</h3>
              <Donut
                centerLabel={t("crm.statistics.kpi.total")}
                centerValue={fmtInt(data.overview.statusDistribution.reduce((a, s) => a + s.count, 0))}
                segments={data.overview.statusDistribution.map((s) => ({
                  label: statusLabel(s.status),
                  value: s.count,
                  color: STATUS_COLOR[s.status],
                }))}
              />
            </Card>
          </div>
        </div>
      )}

      {data && tab === "funnel" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={t("crm.statistics.kpi.conversion")} value={fmtPct(data.funnel.overallConversion)} icon={<TrendingUp size={18} />} />
            <KpiCard label={t("crm.statistics.kpi.rejection")} value={fmtPct(data.quality.rejectionRate)} icon={<Activity size={18} />} hint={`${fmtInt(data.quality.rejectedCount)} ${t("crm.statistics.leads")}`} />
            <KpiCard label={t("crm.statistics.kpi.cycle")} value={days(data.quality.avgCycleDays)} icon={<Clock size={18} />} />
            <KpiCard label={t("crm.statistics.kpi.stuck")} value={fmtInt(data.quality.stuckLeads)} icon={<Clock size={18} />} hint={`${data.quality.stuckThresholdDays}+ ${t("crm.statistics.days")}`} />
          </div>
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink-soft">{t("crm.statistics.funnelTitle")}</h3>
              <div className="flex gap-4 text-xs text-ink-muted">
                <span>{t("crm.statistics.reached")}</span>
                <span>{t("crm.statistics.step")}</span>
              </div>
            </div>
            <Funnel
              stages={data.funnel.stages.map((s) => ({
                label: statusLabel(s.stage),
                count: s.count,
                reachedPct: s.reachedPct,
                stepConversion: s.stepConversion,
              }))}
            />
          </Card>
        </div>
      )}

      {data && tab === "sources" && (
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-medium text-ink-soft">{t("crm.statistics.sourcesTitle")}</h3>
          {data.sources.length === 0 ? (
            <EmptyChart label={t("crm.statistics.error")} />
          ) : (
            <BarList
              rows={data.sources.map((s) => ({
                label: s.name,
                value: s.count,
                sub: `${fmtPct(s.conversion)} · ${fmtInt(s.converted)} ${t("crm.statistics.enrolled")}`,
              }))}
            />
          )}
        </Card>
      )}

      {data && tab === "managers" && (
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-medium text-ink-soft">{t("crm.statistics.managersTitle")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">{t("crm.statistics.manager")}</th>
                  <th className="pb-2 pr-3 text-right font-medium">{t("crm.statistics.leads")}</th>
                  <th className="pb-2 pr-3 text-right font-medium">{t("crm.statistics.kpi.conversion")}</th>
                  <th className="pb-2 pr-3 text-right font-medium">{t("crm.statistics.open")}</th>
                  <th className="pb-2 pr-3 text-right font-medium">{t("crm.statistics.closed")}</th>
                  <th className="pb-2 text-right font-medium">{t("crm.statistics.response")}</th>
                </tr>
              </thead>
              <tbody>
                {data.managers.map((m, i) => (
                  <tr key={m.userId ?? i} className="border-b border-line/60">
                    <td className="py-2 pr-3 text-ink-muted tnum">{i + 1}</td>
                    <td className="py-2 pr-3 font-medium text-ink">
                      {m.name}
                      {i === 0 && data.managers.length > 1 && (
                        <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-amber">★</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tnum">{fmtInt(m.count)}</td>
                    <td className="py-2 pr-3 text-right font-medium text-positive tnum">{fmtPct(m.conversion)}</td>
                    <td className="py-2 pr-3 text-right tnum">{fmtInt(m.open)}</td>
                    <td className="py-2 pr-3 text-right tnum">{fmtInt(m.closed)}</td>
                    <td className="py-2 text-right text-ink-soft tnum">{hours(m.avgResponseHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.managers.length === 0 && <EmptyChart label={t("crm.statistics.error")} />}
          </div>
        </Card>
      )}

      {data && tab === "segments" && (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-medium text-ink-soft">{t("crm.statistics.tagsTitle")}</h3>
              <BarList
                rows={data.segments.tags.map((tg) => ({
                  label: tg.name,
                  value: tg.count,
                  sub: `${fmtPct(tg.conversion)}`,
                  color: tg.color ?? undefined,
                }))}
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-medium text-ink-soft">{t("crm.statistics.cohortTitle")}</h3>
              <BarList
                rows={data.segments.cohort.map((c) => ({
                  label: c.period,
                  value: c.newLeads,
                  sub: `${fmtInt(c.converted)} ${t("crm.statistics.enrolled")}`,
                }))}
              />
            </Card>
          </div>
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-medium text-ink-soft">{t("crm.statistics.heatmapTitle")}</h3>
            <Heatmap
              rows={[...new Set(data.segments.sourceStageHeatmap.map((c) => c.sourceName))]}
              cols={[...LEAD_STATUSES]}
              colLabel={(c) => t(`crm.status.${c}`)}
              cell={(row, col) =>
                data.segments.sourceStageHeatmap.find((c) => c.sourceName === row && c.status === (col as LeadStatus))
                  ?.count ?? 0
              }
            />
          </Card>
        </div>
      )}
    </div>
  );
}
