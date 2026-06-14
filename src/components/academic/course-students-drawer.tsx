"use client";

import { useEffect, useState } from "react";
import { Check, Search, UserPlus } from "lucide-react";
import {
  useAddCourseStudents,
  useAvailableCourseStudents,
} from "@/lib/api/courses";
import { useClassList } from "@/lib/api/classes";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  courseId: string | null;
  onClose: () => void;
}

export function CourseStudentsDrawer({ open, courseId, onClose }: Props) {
  const { t } = useI18n();
  const add = useAddCourseStudents();
  const classes = useClassList();

  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setClassId("");
    setSearch("");
    setSelected(new Set());
    setError(null);
  }, [open]);

  const available = useAvailableCourseStudents(open ? courseId : null, {
    classId: classId || undefined,
    search: search.trim() || undefined,
  });

  const classOptions = [
    { value: "", label: t("courses.students.allClasses") },
    ...(classes.data?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!courseId || selected.size === 0) return;
    setError(null);
    try {
      await add.mutateAsync({ id: courseId, studentIds: Array.from(selected) });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  const rows = available.data ?? [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("courses.students.title")}
      icon={<UserPlus className="h-5 w-5" />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={add.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} loading={add.isPending} disabled={selected.size === 0}>
            {t("common.save")} {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classOptions}
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("courses.students.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}

        {available.isLoading ? (
          <p className="text-sm text-ink-muted">{t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg bg-parchment/50 px-3 py-8 text-center text-sm text-ink-muted">
            {t("courses.students.empty")}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map((student) => {
              const isSelected = selected.has(student.id);
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => toggle(student.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      isSelected ? "border-accent bg-accent/10" : "border-line hover:bg-parchment",
                    )}
                  >
                    <span className="text-ink">
                      {student.fullName}
                      {student.className && (
                        <span className="ml-2 text-xs text-ink-muted">{student.className}</span>
                      )}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
