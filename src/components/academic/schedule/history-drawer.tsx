"use client";

import { History } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { historyActionKey, useScheduleHistory } from "@/lib/api/schedule";

interface Props {
  open: boolean;
  onClose: () => void;
  quarterId: string;
  classId?: string;
}

export function HistoryDrawer({ open, onClose, quarterId, classId }: Props) {
  const { t } = useI18n();
  const { data, isLoading } = useScheduleHistory(quarterId, classId, open);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("sched.hist.title")}
      icon={<History className="h-5 w-5 text-ink-soft" />}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">{t("sched.hist.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {data.items.map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{t(historyActionKey(item.action))}</span>
                <span className="text-xs text-ink-muted">{formatDate(item.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">{item.actorName ?? "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
