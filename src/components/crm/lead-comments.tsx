"use client";

import { useState } from "react";
import { AlarmClock, Check, MessageSquarePlus, Pencil, Pin, Trash2, X } from "lucide-react";
import {
  useAddComment,
  useDeleteComment,
  useLeadComments,
  useUpdateComment,
  type LeadComment,
} from "@/lib/api/crm";
import { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useCrudPermissions } from "@/lib/auth/use-can";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeInput } from "@/components/ui/time-input";
import { isoToDMY } from "@/lib/format";

const textareaCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring";

function fmt(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${isoToDMY(iso)} · ${d.toTimeString().slice(0, 5)}`;
}

export function LeadComments({ leadId }: { leadId: string }) {
  const { t } = useI18n();
  const meId = useAuthStore((s) => s.user?.id);
  // Izohlar lidning o'zidan alohida resurs: qo'shish/tahrirlash/o'chirish
  // huquqi `crm-lead-comments.*` bilan boshqariladi. Egalik (isOwner) — qo'shimcha
  // shart: backend ham begona izohni tahrirlashga yo'l qo'ymaydi.
  const { canCreate, canUpdate, canDelete } = useCrudPermissions("crm-lead-comments");
  const comments = useLeadComments(leadId);
  const add = useAddComment(leadId);
  const update = useUpdateComment(leadId);
  const remove = useDeleteComment(leadId);

  const [body, setBody] = useState("");
  const [remindDate, setRemindDate] = useState("");
  const [remindTime, setRemindTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildRemindAt(): string | undefined {
    if (!remindDate) return undefined;
    const time = remindTime || "09:00";
    const d = new Date(`${remindDate}T${time}`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return;
    try {
      await add.mutateAsync({ body: body.trim(), ...(buildRemindAt() ? { remindAt: buildRemindAt() } : {}) });
      setBody("");
      setRemindDate("");
      setRemindTime("");
    } catch (err) {
      setError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  async function saveEdit(id: string) {
    if (!editBody.trim()) return;
    try {
      await update.mutateAsync({ commentId: id, input: { body: editBody.trim() } });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  const all = comments.data ?? [];
  const pinnedCount = all.filter((c) => c.isPinned).length;
  const list = pinnedOnly ? all.filter((c) => c.isPinned) : all;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <MessageSquarePlus className="h-4 w-4 text-ink-muted" />
          {t("crm.comments.title")}
          {all.length > 0 && <span className="text-ink-muted tnum">({all.length})</span>}
        </p>
        {pinnedCount > 0 && (
          <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setPinnedOnly(false)}
              className={`rounded-md px-2 py-1 font-medium transition ${pinnedOnly ? "text-ink-soft" : "bg-accent text-accent-fg"}`}
            >
              {t("crm.comments.filterAll")}
            </button>
            <button
              type="button"
              onClick={() => setPinnedOnly(true)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition ${pinnedOnly ? "bg-amber text-white" : "text-ink-soft"}`}
            >
              <Pin className="h-3 w-3" />
              {t("crm.comments.filterPinned")}
              <span className="tnum">({pinnedCount})</span>
            </button>
          </div>
        )}
      </div>

      {canCreate && (
        <form onSubmit={submitAdd} className="mb-4 space-y-2 rounded-xl border border-line p-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={t("crm.comments.placeholder")}
            className={textareaCls}
          />
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <AlarmClock className="h-3.5 w-3.5" />
              {t("crm.comments.remindAt")}
            </div>
            <div className="w-36">
              <DatePicker value={remindDate} onChange={setRemindDate} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="w-28">
              <TimeInput value={remindTime} onChange={setRemindTime} />
            </div>
            <Button type="submit" size="sm" className="ml-auto" loading={add.isPending} disabled={!body.trim()}>
              {t("crm.comments.add")}
            </Button>
          </div>
        </form>
      )}

      {comments.isLoading ? (
        <p className="text-sm text-ink-muted">{t("common.loading")}</p>
      ) : list.length === 0 ? (
        <p className="rounded-lg bg-parchment/50 px-3 py-4 text-center text-sm text-ink-muted">
          {t("crm.comments.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              isOwner={Boolean(meId && c.author?.id === meId)}
              canUpdate={canUpdate}
              canDelete={canDelete}
              editing={editingId === c.id}
              editBody={editBody}
              onEditBody={setEditBody}
              onStartEdit={() => {
                setEditingId(c.id);
                setEditBody(c.body);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => saveEdit(c.id)}
              onDelete={() => remove.mutate(c.id)}
              onTogglePin={() => update.mutate({ commentId: c.id, input: { isPinned: !c.isPinned } })}
              onToggleReminder={() => update.mutate({ commentId: c.id, input: { reminderDone: !c.reminderDone } })}
              t={t}
            />
          ))}
        </ul>
      )}

      {error && <p className="mt-2 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
    </div>
  );
}

function CommentItem({
  c,
  isOwner,
  canUpdate,
  canDelete,
  editing,
  editBody,
  onEditBody,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onTogglePin,
  onToggleReminder,
  t,
}: {
  c: LeadComment;
  isOwner: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  editing: boolean;
  editBody: string;
  onEditBody: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleReminder: () => void;
  t: (key: string) => string;
}) {
  return (
    <li className={`rounded-xl border p-3 transition-colors ${c.isPinned ? "border-amber/40 bg-amber/5" : isOwner ? "border-accent/30 bg-accent/10" : "border-line bg-parchment/70"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{c.author?.fullName || t("crm.history.system")}</span>
        <span className="text-xs text-ink-muted tnum">{fmt(c.createdAt)}</span>
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea value={editBody} onChange={(e) => onEditBody(e.target.value)} rows={2} maxLength={2000} className={textareaCls} />
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="secondary" onClick={onCancelEdit}>
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={onSaveEdit}>
              <Check className="h-3.5 w-3.5" /> {t("common.save")}
            </Button>
          </div>
        </div>
      ) : (
        <p className={`mt-1 whitespace-pre-line text-sm ${isOwner ? "text-ink" : "text-ink-soft"}`}>{c.body}</p>
      )}

      {c.remindAt && !editing && (
        <button
          type="button"
          onClick={isOwner && canUpdate ? onToggleReminder : undefined}
          disabled={!isOwner || !canUpdate}
          className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${
            c.reminderDone ? "bg-positive/10 text-positive line-through" : "bg-amber/10 text-amber-600"
          }`}
        >
          <AlarmClock className="h-3.5 w-3.5" />
          {fmt(c.remindAt)}
          {c.reminderDone && <Check className="h-3.5 w-3.5" />}
        </button>
      )}

      {isOwner && !editing && (canUpdate || canDelete) && (
        <div className="mt-2 flex items-center justify-end gap-1">
          {canUpdate && (
            <>
              <Button variant="ghost" size="sm" onClick={onTogglePin} aria-label={t("crm.comments.pin")} className={c.isPinned ? "text-amber-600" : ""}>
                <Pin className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onStartEdit} aria-label={t("common.edit")}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" className="text-negative" onClick={onDelete} aria-label={t("common.delete")}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
