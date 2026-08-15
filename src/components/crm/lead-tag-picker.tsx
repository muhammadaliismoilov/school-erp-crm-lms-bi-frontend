"use client";

import { useState } from "react";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import {
  useCreateTag,
  useLeadTags,
  useSetLeadTags,
  type LeadTagBrief,
} from "@/lib/api/crm";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can } from "@/components/auth/can";

const DEFAULT_COLOR = "#f59e0b";

export function TagChip({ tag, onRemove }: { tag: LeadTagBrief; onRemove?: () => void }) {
  const color = tag.color || DEFAULT_COLOR;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <TagIcon className="h-3 w-3" />
      {tag.name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="remove" className="ml-0.5 hover:opacity-70">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export function LeadTagPicker({ leadId, selected }: { leadId: string; selected: LeadTagBrief[] }) {
  const { t } = useI18n();
  const tags = useLeadTags();
  const setTags = useSetLeadTags();
  const createTag = useCreateTag();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const selectedIds = new Set(selected.map((s) => s.id));

  function toggle(tagId: string) {
    const next = selectedIds.has(tagId)
      ? [...selectedIds].filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    setTags.mutate({ leadId, tagIds: next });
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const tag = await createTag.mutateAsync({ name, color: DEFAULT_COLOR });
    setNewName("");
    setTags.mutate({ leadId, tagIds: [...selectedIds, tag.id] });
  }

  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-ink-muted">{t("crm.tags.title")}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((tag) => (
          <TagChip key={tag.id} tag={tag} onRemove={() => toggle(tag.id)} />
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2 py-0.5 text-xs text-ink-muted hover:border-amber hover:text-amber-600"
        >
          <Plus className="h-3 w-3" />
          {t("crm.tags.add")}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2 rounded-xl border border-line p-3">
          <div className="flex flex-wrap gap-1.5">
            {(tags.data ?? []).map((tag) => {
              const active = selectedIds.has(tag.id);
              const color = tag.color || DEFAULT_COLOR;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${active ? "" : "opacity-50"}`}
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <TagIcon className="h-3 w-3" />
                  {tag.name}
                  {tag.leadCount !== undefined && <span className="tnum">· {tag.leadCount}</span>}
                </button>
              );
            })}
            {(tags.data?.length ?? 0) === 0 && <span className="text-xs text-ink-muted">{t("crm.tags.empty")}</span>}
          </div>
          <Can permission="crm-tags.create">
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                maxLength={60}
                placeholder={t("crm.tags.newPlaceholder")}
                className="h-8"
              />
              <Button size="sm" variant="secondary" onClick={handleCreate} loading={createTag.isPending} disabled={!newName.trim()}>
                {t("crm.tags.create")}
              </Button>
            </div>
          </Can>
        </div>
      )}
    </div>
  );
}
