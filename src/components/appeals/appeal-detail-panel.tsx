"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldOff } from "lucide-react";
import {
  useAssignAppeal,
  useTransferAppeal,
  useUpdateAppeal,
  type Appeal,
  type AppealStatus,
} from "@/lib/api/appeals";
import { useSchoolOptions } from "@/lib/api/hr-branches";
import { useUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { useCan, useCrudPermissions } from "@/lib/auth/use-can";
import { applicantName } from "@/lib/appeals/sla";
import { SlaBadge } from "./sla-badge";

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

/**
 * Murojaat tafsiloti — modal emas, ro'yxat yonidagi panel.
 *
 * NEGA PANEL: rahbariyat kuniga o'nlab murojaat ko'radi. Modal har safar
 * ro'yxatni bekitib, yopilishni talab qiladi; panelda esa ro'yxat ko'rinib
 * turadi va keyingisiga bitta bosishda o'tiladi.
 */
export function AppealDetailPanel({ appeal }: { appeal: Appeal }) {
  const { t, locale } = useI18n();
  // Holat o'zgartirish (PATCH :id) va mas'ul biriktirish (PATCH :id/assign) —
  // ikkalasi ham `appeals.update`. Ko'chirish esa alohida, CEO'ga tegishli kod.
  const { canUpdate } = useCrudPermissions("appeals");
  const can = useCan();
  const canTransfer = can("appeals.transfer");

  const update = useUpdateAppeal();
  const assign = useAssignAppeal();
  const transfer = useTransferAppeal();
  const { data: usersData } = useUsers({ page: 1, limit: 100 });
  const { data: schoolOptions } = useSchoolOptions();

  const [newStatus, setNewStatus] = useState<AppealStatus | "">("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [targetSchool, setTargetSchool] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewStatus("");
    setResolutionNote("");
    setAssigneeId(appeal.assigneeUserId ?? "");
    setTargetSchool("");
    setError(null);
  }, [appeal.id, appeal.assigneeUserId]);

  const userById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersData?.items ?? []) map.set(u.id, u.fullName);
    return map;
  }, [usersData]);

  const statusOptions: SelectOption[] = useMemo(
    () => NEXT_STATUSES[appeal.status].map((s) => ({ value: s, label: t(`appeals.status.${s}`) })),
    [appeal.status, t],
  );
  const assigneeOptions: SelectOption[] = useMemo(
    () => (usersData?.items ?? []).map((u) => ({ value: u.id, label: u.fullName })),
    [usersData],
  );
  const schoolSelectOptions: SelectOption[] = useMemo(
    () => (schoolOptions ?? []).map((s) => ({ value: s.id, label: s.label })),
    [schoolOptions],
  );

  const needsNote = newStatus !== "" && TERMINAL_STATUSES.includes(newStatus);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const name = applicantName(appeal, t("appeals.anonymous"));

  function reportError(err: unknown): void {
    setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
  }

  async function handleSaveStatus() {
    if (newStatus === "") return;
    setError(null);
    if (needsNote && resolutionNote.trim().length < 3) {
      return setError(t("appeals.resolution.required"));
    }
    try {
      await update.mutateAsync({
        id: appeal.id,
        input: { status: newStatus, ...(needsNote ? { resolutionNote: resolutionNote.trim() } : {}) },
      });
      setNewStatus("");
      setResolutionNote("");
    } catch (err) {
      reportError(err);
    }
  }

  async function handleSaveAssignee() {
    setError(null);
    try {
      await assign.mutateAsync({
        id: appeal.id,
        assigneeUserId: assigneeId === "" ? null : assigneeId,
      });
    } catch (err) {
      reportError(err);
    }
  }

  async function handleTransfer() {
    if (!targetSchool) return;
    setError(null);
    try {
      await transfer.mutateAsync({ id: appeal.id, schoolId: targetSchool });
      setTargetSchool("");
    } catch (err) {
      reportError(err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">{name}</h2>
          {appeal.isAnonymous && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-1.5 py-0.5 text-xs text-ink-muted"
              title={t("appeals.f.anonymousHint")}
            >
              <ShieldOff className="h-3 w-3" />
              {t("appeals.anonymous")}
            </span>
          )}
        </div>
        {appeal.phone && <p className="font-mono text-sm text-ink-muted">{appeal.phone}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={appeal.type === "complaint" ? "negative" : "positive"}>
          {t(`appeals.type.${appeal.type}`)}
        </Badge>
        <Badge tone={STATUS_TONE[appeal.status]}>{t(`appeals.status.${appeal.status}`)}</Badge>
        <SlaBadge appeal={appeal} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Info label={t("appeals.detail.targetRole")} value={t(`appeals.role.${appeal.targetRole}`)} />
        <Info label={t("appeals.detail.source")} value={t(`appeals.source.${appeal.source}`)} />
        <Info label={t("appeals.detail.created")} value={dateFmt.format(new Date(appeal.createdAt))} />
        <Info label={t("appeals.detail.dueAt")} value={dateFmt.format(new Date(appeal.dueAt))} />
      </div>

      <div>
        <p className="label mb-1.5">{t("appeals.detail.description")}</p>
        <p className="whitespace-pre-wrap rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
          {appeal.description}
        </p>
      </div>

      {appeal.assigneeUserId && (
        <p className="text-sm text-ink-muted">
          {t("appeals.detail.assignee")}:{" "}
          <span className="text-ink">
            {userById.get(appeal.assigneeUserId) ?? appeal.assigneeUserId}
          </span>
        </p>
      )}

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
            <Button onClick={handleSaveStatus} disabled={newStatus === ""} loading={update.isPending}>
              {t("appeals.statusChange.save")}
            </Button>
          </div>

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
            <Button variant="secondary" onClick={handleSaveAssignee} loading={assign.isPending}>
              {t("appeals.assign.save")}
            </Button>
          </div>

          {canTransfer && (
            <div className="space-y-3">
              <Field label={t("appeals.transfer.label")} htmlFor="a-transfer">
                <Select
                  id="a-transfer"
                  value={targetSchool}
                  onChange={(e) => setTargetSchool(e.target.value)}
                  options={schoolSelectOptions}
                  placeholder={t("appeals.f.school")}
                />
              </Field>
              <p className="text-xs text-ink-muted">{t("appeals.transfer.hint")}</p>
              <Button
                variant="secondary"
                onClick={handleTransfer}
                disabled={!targetSchool}
                loading={transfer.isPending}
              >
                {t("appeals.transfer.save")}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}
