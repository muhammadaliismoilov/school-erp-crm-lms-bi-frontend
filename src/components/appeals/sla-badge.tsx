"use client";

import { Clock, TriangleAlert } from "lucide-react";
import type { Appeal } from "@/lib/api/appeals";
import { resolveSla, type SlaTone } from "@/lib/appeals/sla";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<SlaTone, string> = {
  overdue: "bg-negative/12 text-negative",
  soon: "bg-caution/14 text-caution",
  calm: "text-ink-muted",
  closed: "text-ink-muted",
};

/**
 * Muddat belgisi.
 *
 * Yopilgan murojaatda UMUMAN chizilmaydi: hal qilingan ishda muddat raqami
 * yordam bermaydi, faqat ro'yxatni shovqin bilan to'ldiradi.
 */
export function SlaBadge({ appeal, className }: { appeal: Appeal; className?: string }) {
  const { t } = useI18n();
  const sla = resolveSla(appeal);
  if (sla.tone === "closed") return null;

  const span = sla.days > 0 ? `${sla.days} ${t("common.days")}` : `${sla.hours} ${t("common.hours")}`;
  const label =
    sla.tone === "overdue"
      ? t("appeals.sla.overdue").replace("{n}", span)
      : sla.days === 0
        ? t("appeals.sla.today")
        : t("appeals.sla.left").replace("{n}", span);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs",
        TONE_CLASS[sla.tone],
        className,
      )}
    >
      {sla.tone === "overdue" ? (
        <TriangleAlert className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}
