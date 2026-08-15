"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAssignAppeal,
  useUpdateAppeal,
  type Appeal,
  type AppealStatus,
} from "@/lib/api/appeals";
import { useUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select, type SelectOption } from "@/components/ui/select";
import { useCrudPermissions } from "@/lib/auth/use-can";

interface AppealDetailModalProps {
  appeal: Appeal | null;
  onClose: () => void;
}

/** Allowed status transitions — mirrors the backend state machine. */
const NEXT_STATUSES: Record<AppealStatus, AppealStatus[]> = {
  pending: ["in_progress", "resolved", "rejected"],
  in_progress: ["resolved", "rejected", "pending"],
  resolved: ["in_progress"],
  rejected: ["in_progress"],
};
const TERMINAL_STATUSES: AppealStatus[] = ["resolved", "rejected"];

const STATUS_TONE: Record<AppealStatus, "neutral" | "positive" | "negative" | "caution" | "accent"> = {
  pending: "caution",
  in_progress: "accent",
  resolved: "positive",
  rejected: "negative",
};

export function AppealDetailModal({ appeal, onClose }: AppealDetailModalProps) {
  const { t, locale } = useI18n();
  // Holat o'zgartirish (PATCH :id) va mas'ul biriktirish (PATCH :id/assign) —
  // ikkalasi ham `appeals.update`.
  const { canUpdate } = useCrudPermissions("appeals");

  const update = useUpdateAppeal();
  const assign = useAssignAppeal();
  const { data: usersData } = useUsers({ page: 1, limit: 100 });

  const [newStatus, setNewStatus] = useState<AppealStatus | "">("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appeal) {
      setNewStatus("");
      setResolutionNote("");
      setAssigneeId(appeal.assigneeUserId ?? "");
      setError(null);
    }
  }, [appeal]);

  const userById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersData?.items ?? []) map.set(u.id, u.fullName);
    return map;
  }, [usersData]);

  const statusOptions: SelectOption[] = useMemo(() => {
    if (!appeal) return [];
    return NEXT_STATUSES[appeal.status].map((s) => ({
      value: s,
      label: t(`appeals.status.${s}`),
    }));
  }, [appeal, t]);

  const assigneeOptions: SelectOption[] = useMemo(
    () => (usersData?.items ?? []).map((u) => ({ value: u.id, label: u.fullName })),
    [usersData],
  );

  if (!appeal) return null;

  const needsNote = newStatus !== "" && TERMINAL_STATUSES.includes(newStatus);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function handleSaveStatus() {
    if (!appeal || newStatus === "") return;
    setError(null);
    if (needsNote && resolutionNote.trim().length < 3) {
      return setError(t("appeals.resolution.required"));
    }
    try {
      await update.mutateAsync({
        id: appeal.id,
        input: {
          status: newStatus,
          ...(needsNote ? { resolutionNote: resolutionNote.trim() } : {}),
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  async function handleSaveAssignee() {
    if (!appeal) return;
    setError(null);
    try {
      await assign.mutateAsync({
        id: appeal.id,
        assigneeUserId: assigneeId === "" ? null : assigneeId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  return (
    <Modal
      open={Boolean(appeal)}
      onClose={onClose}
      size="lg"
      title={t("appeals.detail.title")}
      subtitle={appeal.fullName}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label={t("appeals.detail.applicant")} value={appeal.fullName} />
          <Info label={t("appeals.detail.phone")} value={appeal.phone} mono />
          <Info
            label={t("appeals.detail.type")}
            value={t(`appeals.type.${appeal.type}`)}
          />
          <Info
            label={t("appeals.detail.targetRole")}
            value={t(`appeals.role.${appeal.targetRole}`)}
          />
          <Info
            label={t("appeals.detail.source")}
            value={t(`appeals.source.${appeal.source}`)}
          />
          <Info label={t("appeals.detail.created")} value={dateFmt.format(new Date(appeal.createdAt))} />
        </div>

        <div>
          <p className="label mb-1.5">{t("appeals.detail.description")}</p>
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
            {appeal.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="label">{t("appeals.detail.status")}:</span>
          <Badge tone={STATUS_TONE[appeal.status]}>{t(`appeals.status.${appeal.status}`)}</Badge>
          {appeal.assigneeUserId && (
            <span className="text-sm text-ink-muted">
              · {t("appeals.detail.assignee")}: {userById.get(appeal.assigneeUserId) ?? appeal.assigneeUserId}
            </span>
          )}
        </div>

        {appeal.resolutionNote && (
          <div>
            <p className="label mb-1.5">{t("appeals.detail.resolution")}</p>
            <p className="whitespace-pre-wrap rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
              {appeal.resolutionNote}
            </p>
          </div>
        )}

        {canUpdate && (
          <div className="space-y-6 border-t border-line pt-6">
            {/* Status workflow */}
            <div className="space-y-3">
              <Field label={t("appeals.statusChange.label")} htmlFor="a-status">
                <Select
                  id="a-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AppealStatus)}
                  options={statusOptions}
                  placeholder={t("appeals.statusChange.label")}
                />
              </Field>
              {needsNote && (
                <Field label={`${t("appeals.resolution.label")} *`} htmlFor="a-note">
                  <textarea
                    id="a-note"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder={t("appeals.resolution.placeholder")}
                    maxLength={2000}
                    rows={3}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
                  />
                </Field>
              )}
              <Button
                onClick={handleSaveStatus}
                disabled={newStatus === ""}
                loading={update.isPending}
              >
                {t("appeals.statusChange.save")}
              </Button>
            </div>

            {/* Assignee */}
            <div className="space-y-3">
              <Field label={t("appeals.assign.label")} htmlFor="a-assignee">
                <Select
                  id="a-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  options={assigneeOptions}
                  placeholder={t("appeals.assign.none")}
                />
              </Field>
              <Button
                variant="secondary"
                onClick={handleSaveAssignee}
                loading={assign.isPending}
              >
                {t("appeals.assign.save")}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </div>
    </Modal>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className={mono ? "font-mono text-sm text-ink" : "text-sm text-ink"}>{value}</p>
    </div>
  );
}
