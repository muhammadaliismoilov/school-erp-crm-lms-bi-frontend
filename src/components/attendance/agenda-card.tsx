"use client";

import { CheckCircle2, ChevronRight, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AgendaItem } from "@/lib/api/attendance-sessions";

const STATUS_META: Record<AgendaItem["status"], { label: string; tone: "neutral" | "positive" | "caution" }> = {
  scheduled: { label: "Ochilmagan", tone: "neutral" },
  open: { label: "Ochilgan", tone: "caution" },
  confirmed: { label: "Tasdiqlangan", tone: "positive" },
  cancelled: { label: "Bekor", tone: "neutral" },
};

export function AgendaCard({
  item,
  active,
  loading,
  onClick,
}: {
  item: AgendaItem;
  active: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  const meta = STATUS_META[item.status];
  const opened = item.sessionId != null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        "focus-visible:focus-ring",
        active
          ? "border-navy bg-surface shadow-card"
          : "border-line bg-surface hover:border-ink-muted hover:shadow-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-semibold text-ink">
              {item.subjectName}
            </span>
            <Badge tone={item.sessionType === "course" ? "accent" : "neutral"}>
              {item.sessionType === "course" ? "Kurs" : "Dars"}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">{item.className}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-ink-soft">
            <Clock className="h-3.5 w-3.5" />
            {item.startTime.slice(0, 5)}–{item.endTime.slice(0, 5)}
          </span>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {opened && item.counts ? (
          <div className="flex gap-3 text-xs text-ink-soft">
            <span className="text-positive">✓ {item.counts.present}</span>
            <span className="text-caution">◷ {item.counts.late}</span>
            <span className="text-negative">✕ {item.counts.absent}</span>
            <span className="text-ink-muted">/ {item.total}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
            <CheckCircle2 className="h-3.5 w-3.5" /> Davomat olish
          </span>
        )}
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 text-ink-muted" />
        )}
      </div>
    </button>
  );
}
