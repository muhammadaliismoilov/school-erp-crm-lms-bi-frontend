"use client";

import { Clock, GraduationCap, Info, Pencil, Trash2 } from "lucide-react";
import {
  LEAD_STATUSES,
  leadHistoryActionKey,
  useLead,
  useLeadHistory,
  useMoveLead,
  type Lead,
  type LeadStatus,
} from "@/lib/api/crm";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Select } from "@/components/ui/select";
import { isoToDMY } from "@/lib/format";
import { LeadComments } from "@/components/crm/lead-comments";
import { LeadTagPicker } from "@/components/crm/lead-tag-picker";

interface Props {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onEnroll: (lead: Lead) => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

export function LeadDetailDrawer({ open, leadId, onClose, onEdit, onDelete, onEnroll }: Props) {
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canManage = can("crm.manage");
  const { data, isLoading } = useLead(open ? leadId : null);
  const history = useLeadHistory(open ? leadId : null);
  const move = useMoveLead();

  const statusOptions = LEAD_STATUSES.map((s) => ({ value: s, label: t(`crm.status.${s}`) }));

  const formatDateTime = (iso: string): string => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : `${isoToDMY(iso)} · ${d.toTimeString().slice(0, 5)}`;
  };

  return (
    <Drawer open={open} onClose={onClose} title={t("crm.lead.detailTitle")} icon={<Info className="h-5 w-5" />}>
      {isLoading || !data ? (
        <p className="text-sm text-ink-muted">{t("common.loading")}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">{data.fullName}</h3>
              <p className="text-sm text-ink-muted tnum">{data.phone}</p>
            </div>
            {canManage && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(data)} aria-label={t("common.edit")}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-negative"
                  onClick={() => onDelete(data)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {canManage && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-ink-muted">{t("crm.lead.changeStatus")}</p>
              <Select
                value={data.status}
                onChange={(e) => move.mutate({ id: data.id, status: e.target.value as LeadStatus })}
                options={statusOptions}
                disabled={move.isPending}
              />
            </div>
          )}

          {/* Muvaffaqiyatli (shartnoma) lid → o'quvchiga aylantirish */}
          {data.status === "contract" &&
            (data.enrolledStudentId ? (
              <div className="flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/8 px-4 py-3 text-sm text-positive">
                <GraduationCap className="h-4 w-4" />
                {t("crm.enroll.alreadyEnrolled")}
              </div>
            ) : (
              canManage && (
                <Button className="w-full" onClick={() => onEnroll(data)}>
                  <GraduationCap className="h-4 w-4" />
                  {t("crm.enroll.button")}
                </Button>
              )
            ))}

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-line p-4">
            <InfoRow label={t("crm.lead.email")} value={data.email || "—"} />
            <InfoRow label={t("crm.lead.source")} value={data.source?.name || "—"} />
            <InfoRow label={t("crm.lead.manager")} value={data.assignedTo?.fullName || "—"} />
            <InfoRow label={t("crm.lead.status")} value={t(`crm.status.${data.status}`)} />
            <div className="col-span-2">
              <InfoRow label={t("crm.lead.notes")} value={data.notes || "—"} />
            </div>
          </div>

          {canManage && <LeadTagPicker leadId={data.id} selected={data.tags ?? []} />}

          <LeadComments leadId={data.id} canManage={canManage} />

          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock className="h-4 w-4 text-ink-muted" />
              {t("crm.history.title")}
            </p>

            {history.isLoading ? (
              <p className="text-sm text-ink-muted">{t("common.loading")}</p>
            ) : (history.data?.length ?? 0) === 0 ? (
              <p className="rounded-lg bg-parchment/50 px-3 py-4 text-center text-sm text-ink-muted">
                {t("crm.history.empty")}
              </p>
            ) : (
              <ol className="space-y-3 border-l border-line pl-4">
                {history.data?.map((entry) => {
                  const statusDetail =
                    entry.details && typeof entry.details.status === "string"
                      ? t(`crm.status.${entry.details.status}`)
                      : null;
                  return (
                    <li key={entry.id} className="relative">
                      <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-sm font-medium text-ink">
                          {entry.actorName || t("crm.history.system")}
                        </span>
                        <span className="text-xs text-ink-muted tnum">{formatDateTime(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm text-ink-soft">
                        {t(leadHistoryActionKey(entry.action))}
                        {statusDetail ? `: ${statusDetail}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
