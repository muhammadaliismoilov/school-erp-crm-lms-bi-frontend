"use client";

import { useState } from "react";
import { LEAD_STATUSES, groupLeadsByStatus, type Lead, type LeadStats, type LeadStatus } from "@/lib/api/crm";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

interface Props {
  leads: Lead[];
  stats?: LeadStats;
  onOpen: (lead: Lead) => void;
  onMove: (id: string, status: LeadStatus) => void;
  /** Ustunlar orasida sudrash = lidni yangilash (`crm-leads.update`). */
  canMove: boolean;
}

const STATUS_DOT: Record<LeadStatus, string> = {
  new: "bg-accent",
  contacted: "bg-amber",
  interested: "bg-caution",
  trial_lesson: "bg-positive",
  contract: "bg-navy",
  rejected: "bg-negative",
};

export function LeadKanban({ leads, stats, onOpen, onMove, canMove }: Props) {
  const { t } = useI18n();
  const groups = groupLeadsByStatus(leads);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<LeadStatus | null>(null);

  function handleDrop(status: LeadStatus) {
    if (dragId) {
      const lead = leads.find((l) => l.id === dragId);
      if (lead && lead.status !== status) onMove(dragId, status);
    }
    setDragId(null);
    setOverStatus(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {LEAD_STATUSES.map((status) => (
        <div
          key={status}
          onDragOver={(e) => {
            if (!canMove) return;
            e.preventDefault();
            setOverStatus(status);
          }}
          onDrop={() => handleDrop(status)}
          className={cn(
            "flex w-72 shrink-0 flex-col rounded-xl border bg-surface/40 p-2 transition-colors",
            overStatus === status ? "border-accent bg-accent/5" : "border-line",
          )}
        >
          <div className="mb-2 flex items-center justify-between px-1.5 py-1">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[status])} />
              {t(`crm.status.${status}`)}
            </span>
            <span className="rounded-full bg-parchment-deep px-2 py-0.5 text-xs text-ink-soft tnum">
              {stats?.[status] ?? groups[status].length}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            {groups[status].map((lead) => (
              <button
                key={lead.id}
                type="button"
                draggable={canMove}
                onDragStart={() => setDragId(lead.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverStatus(null);
                }}
                onClick={() => onOpen(lead)}
                className={cn(
                  "rounded-lg border border-line bg-surface p-3 text-left transition-shadow hover:shadow-card",
                  canMove && "cursor-grab active:cursor-grabbing",
                  dragId === lead.id && "opacity-50",
                )}
              >
                <p className="text-sm font-medium text-ink">{lead.fullName}</p>
                <p className="mt-0.5 text-xs text-ink-muted tnum">{lead.phone}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {lead.source && (
                    <span className="inline-block rounded bg-parchment/60 px-1.5 py-0.5 text-[11px] text-ink-soft">
                      {lead.source.name}
                    </span>
                  )}
                  {(lead.tags ?? []).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block rounded px-1.5 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: `${tag.color || "#f59e0b"}1f`, color: tag.color || "#f59e0b" }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {groups[status].length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-ink-muted/70">{t("crm.lead.emptyColumn")}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
