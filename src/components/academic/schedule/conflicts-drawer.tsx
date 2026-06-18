"use client";

import { AlertTriangle } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { useScheduleConflicts, type ScheduleConflict } from "@/lib/api/schedule";

interface Props {
  open: boolean;
  onClose: () => void;
  quarterId: string;
}

export function ConflictsDrawer({ open, onClose, quarterId }: Props) {
  const { t } = useI18n();
  const { data, isLoading } = useScheduleConflicts(quarterId, open);

  const typeLabel = (type: ScheduleConflict["type"]) =>
    type === "teacher" ? t("sched.cf.teacher") : type === "room" ? t("sched.cf.room") : t("sched.cf.class");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("sched.cf.title")}
      icon={<AlertTriangle className="h-5 w-5 text-amber" />}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : !data || data.total === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">{t("sched.cf.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {data.conflicts.map((c, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
                  {typeLabel(c.type)}
                </span>
                <span className="text-xs text-ink-muted">
                  {t(`sched.day.${c.weekday}`)} · {c.periodCode}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-ink">{c.entityName ?? "—"}</p>
              <p className="text-xs text-ink-muted">
                {(c.classes ?? (c.subjects as string[]) ?? []).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
