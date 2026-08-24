"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  LEAD_STATUSES,
  useCreateLead,
  useLeadSources,
  useUpdateLead,
  type Lead,
  type LeadInput,
  type LeadStatus,
} from "@/lib/api/crm";
import { useUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/input";
import { isCompleteUzPhone, PhoneInput, UZ_PHONE_PREFIX } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";

interface Props {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function LeadFormDrawer({ open, lead, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateLead();
  const update = useUpdateLead();
  const isEdit = Boolean(lead);
  const pending = create.isPending || update.isPending;

  const sources = useLeadSources();
  // Any staff member can be the responsible manager — no role filter, otherwise
  // the dropdown is empty when nobody holds the exact SALES_MANAGER role.
  const managers = useUsers({ limit: 100 });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(UZ_PHONE_PREFIX);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [sourceId, setSourceId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFirstName(lead?.firstName ?? "");
    setLastName(lead?.lastName ?? "");
    setPhone(lead?.phone ?? UZ_PHONE_PREFIX);
    setEmail(lead?.email ?? "");
    setStatus(lead?.status ?? "new");
    setSourceId(lead?.source?.id ?? "");
    setAssignedToId(lead?.assignedTo?.id ?? "");
    setNotes(lead?.notes ?? "");
    setError(null);
  }, [open, lead]);

  const statusOptions = LEAD_STATUSES.map((s) => ({ value: s, label: t(`crm.status.${s}`) }));
  const sourceOptions = [
    { value: "", label: t("crm.lead.noSource") },
    ...(sources.data ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];
  const managerOptions = [
    { value: "", label: t("crm.lead.noManager") },
    ...(managers.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName })),
  ];

  const FIELD_LABELS = {
    firstName: t("crm.lead.firstName"),
    lastName: t("crm.lead.lastName"),
    phone: t("crm.lead.phone"),
    email: t("crm.lead.email"),
    notes: t("crm.lead.notes"),
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) return setError(t("crm.err.firstName"));
    if (!isCompleteUzPhone(phone.trim())) return setError(t("crm.err.phone"));

    const input: LeadInput = {
      firstName: firstName.trim(),
      phone: phone.trim(),
      status,
      ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(sourceId ? { sourceId } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    try {
      if (isEdit && lead) {
        await update.mutateAsync({ id: lead.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detailedMessage("uz", FIELD_LABELS) : t("common.error"));
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? t("crm.lead.edit") : t("crm.lead.new")}
      subtitle={t("crm.lead.formSubtitle")}
      icon={<UserPlus className="h-5 w-5" />}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="lead-form" loading={pending}>
            {isEdit ? t("common.save") : t("crm.lead.create")}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("crm.lead.firstName")} htmlFor="lead-first">
            <Input id="lead-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={80} />
          </Field>
          <Field label={t("crm.lead.lastName")} htmlFor="lead-last">
            <Input id="lead-last" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={80} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("crm.lead.phone")} htmlFor="lead-phone">
            <PhoneInput id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={t("crm.lead.email")} htmlFor="lead-email">
            <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("crm.lead.source")} htmlFor="lead-source">
            <Select id="lead-source" value={sourceId} onChange={(e) => setSourceId(e.target.value)} options={sourceOptions} />
          </Field>
          <Field label={t("crm.lead.status")} htmlFor="lead-status">
            <Select id="lead-status" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} options={statusOptions} />
          </Field>
        </div>

        <Field label={t("crm.lead.manager")} htmlFor="lead-manager">
          <Select id="lead-manager" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} options={managerOptions} />
        </Field>

        <Field label={t("crm.lead.notes")} htmlFor="lead-notes">
          <textarea
            id="lead-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        {error && (
          <p className="whitespace-pre-line rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </form>
    </Drawer>
  );
}
