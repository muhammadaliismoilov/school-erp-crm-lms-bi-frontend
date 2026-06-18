import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { LeadStatus } from "./crm";

// Mirrors the backend `LeadStatisticsDto` (GET /crm/stats).

export interface StatusCount {
  status: LeadStatus;
  count: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface OverviewStats {
  totalLeads: number;
  newLeads: number;
  newLeadsDelta: number | null;
  conversionRate: number;
  conversionRateDelta: number | null;
  avgCycleDays: number | null;
  trend: TrendPoint[];
  statusDistribution: StatusCount[];
}

export interface FunnelStage {
  stage: LeadStatus | "enrolled";
  count: number;
  reachedPct: number;
  stepConversion: number | null;
}

export interface FunnelStats {
  stages: FunnelStage[];
  overallConversion: number;
}

export interface QualityStats {
  rejectionRate: number;
  rejectedCount: number;
  avgCycleDays: number | null;
  stuckLeads: number;
  stuckThresholdDays: number;
}

export interface SourceStat {
  sourceId: string | null;
  name: string;
  count: number;
  converted: number;
  conversion: number;
}

export interface ManagerStat {
  userId: string | null;
  name: string;
  count: number;
  converted: number;
  conversion: number;
  open: number;
  closed: number;
  avgResponseHours: number | null;
}

export interface TagSegment {
  tagId: string;
  name: string;
  color: string | null;
  count: number;
  converted: number;
  conversion: number;
}

export interface CohortPoint {
  period: string;
  newLeads: number;
  converted: number;
}

export interface SourceStageCell {
  sourceId: string | null;
  sourceName: string;
  status: LeadStatus;
  count: number;
}

export interface SegmentStats {
  tags: TagSegment[];
  cohort: CohortPoint[];
  sourceStageHeatmap: SourceStageCell[];
}

export interface LeadStatistics {
  range: { from: string | null; to: string | null };
  overview: OverviewStats;
  funnel: FunnelStats;
  quality: QualityStats;
  sources: SourceStat[];
  managers: ManagerStat[];
  segments: SegmentStats;
}

export interface StatsRange {
  from?: string;
  to?: string;
}

export function useLeadStats(range: StatsRange) {
  return useQuery({
    queryKey: ["crm", "stats", range],
    queryFn: () =>
      apiRequest<LeadStatistics>("/crm/stats", {
        query: { from: range.from, to: range.to },
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
