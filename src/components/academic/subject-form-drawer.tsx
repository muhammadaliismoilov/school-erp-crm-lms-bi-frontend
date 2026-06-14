"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import {
  useCreateSubject,
  useUpdateSubject,
  type Subject,
  type SubjectInput,
} from "@/lib/api/subjects";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  subject: Subject | null;
  onClose: () => void;
}

/** Fixed swatch palette shown in the colour picker (matches the Durbin design). */
const PALETTE = [
  "#2563EB", "#7C3AED", "#0D9488", "#DC2626", "#6D28D9", "#16A34A",
  "#0284C7", "#DB2777", "#EF4444", "#0891B2", "#F97316", "#15803D",
  "#F59E0B", "#38BDF8", "#84CC16", "#4F46E5", "#E11D48", "#14B8A6",
  "#22D3EE", "#EC4899", "#A855F7", "#94A3B8",
];

const HEX_RE = /^#[0-9A-F]{6}$/;
const DEFAULT_COLOR = "#2563EB";

export function SubjectFormDrawer({ open, subject, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const isEdit = Boolean(subject);
  const pending = create.isPending || update.isPending;

  const [name, setName] = useState("");
  const [russianName, setRussianName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(subject ? subject.localizedName.uz : "");
    setRussianName(subject ? subject.localizedName.ru : "");
    setEnglishName(subject && subject.localizedName.en !== subject.localizedName.uz ? subject.localizedName.en : "");
    setColor(subject ? subject.color : DEFAULT_COLOR);
    setDescription("");
    setActive(subject ? subject.isActive : true);
    setError(null);
  }, [open, subject]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError(t("subjects.err.name"));
    if (!russianName.trim()) return setError(t("subjects.err.russianName"));
    const normalizedColor = color.trim().toUpperCase();
    if (!HEX_RE.test(normalizedColor)) return setError(t("subjects.err.color"));

    const input: SubjectInput = {
      name: name.trim(),
      russianName: russianName.trim(),
      color: normalizedColor,
      ...(englishName.trim() ? { englishName: englishName.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      status: active ? "active" : "inactive",
    };

    try {
      if (isEdit && subject) {
        await update.mutateAsync({ id: subject.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detailedMessage("uz", FIELD_LABELS) : t("common.error"));
    }
  }

  const FIELD_LABELS = {
    name: t("subjects.f.name"),
    russianName: t("subjects.f.russianName"),
    englishName: t("subjects.f.englishName"),
    color: t("subjects.f.color"),
    description: t("subjects.f.description"),
    status: t("subjects.f.active"),
    isActive: t("subjects.f.active"),
    code: "Kod",
  };

  const title = isEdit ? t("subjects.edit.title") : t("subjects.new.title");
  const subtitle = isEdit ? t("subjects.edit.subtitle") : t("subjects.new.subtitle");
  const submitLabel = isEdit ? t("subjects.edit.submit") : t("subjects.new.submit");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={<BookOpen className="h-5 w-5" />}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="subject-form" loading={pending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("subjects.f.name")} htmlFor="subject-name">
          <Input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("subjects.f.namePlaceholder")}
            maxLength={120}
          />
        </Field>

        <Field label={t("subjects.f.russianName")} htmlFor="subject-ru">
          <Input
            id="subject-ru"
            value={russianName}
            onChange={(e) => setRussianName(e.target.value)}
            placeholder={t("subjects.f.russianNamePlaceholder")}
            maxLength={120}
          />
        </Field>

        <Field label={t("subjects.f.englishName")} htmlFor="subject-en">
          <Input
            id="subject-en"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder={t("subjects.f.englishNamePlaceholder")}
            maxLength={120}
          />
        </Field>

        <div className="space-y-2">
          <label className="label block">{t("subjects.f.color")}</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                aria-label={swatch}
                className={cn(
                  "h-7 w-7 rounded-full transition-transform",
                  color.toUpperCase() === swatch && "ring-2 ring-offset-2 ring-ink scale-110",
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 shrink-0 rounded-lg border border-line" style={{ backgroundColor: color }} />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#2563EB"
              maxLength={7}
              className="font-mono"
            />
          </div>
        </div>

        <Field label={t("subjects.f.description")} htmlFor="subject-desc">
          <textarea
            id="subject-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("subjects.f.descriptionPlaceholder")}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
          <span className="text-sm font-medium text-ink">{t("subjects.f.active")}</span>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        {error && (
          <p className="whitespace-pre-line rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">
            {error}
          </p>
        )}
      </form>
    </Drawer>
  );
}
