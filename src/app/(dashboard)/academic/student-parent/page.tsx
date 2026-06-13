"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link2, Check } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { useList } from "@/lib/api/resource";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, Spinner } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { cn, fullName, loc } from "@/lib/utils";

const RELATIONS = [
  { value: "father", label: "Ota" },
  { value: "mother", label: "Ona" },
  { value: "guardian", label: "Vasiy" },
  { value: "relative", label: "Qarindosh" },
];

export default function StudentParentPage() {
  const { t, locale } = useI18n();
  const students = useList("sp-students", "/students", { limit: 100 });
  const parents = useList("sp-parents", "/users", { role: "PARENT", limit: 100 });

  const [studentId, setStudentId] = useState("");
  const [parentId, setParentId] = useState("");
  const [relation, setRelation] = useState("father");
  const [isPrimary, setIsPrimary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const link = useMutation({
    mutationFn: () =>
      apiRequest(`/students/${studentId}/parents`, {
        method: "POST",
        body: { parentId, relation, isPrimary },
      }),
  });

  async function submit() {
    setError(null);
    setDone(false);
    if (!studentId || !parentId) {
      setError("O‘quvchi va ota-onani tanlang");
      return;
    }
    try {
      await link.mutateAsync();
      setDone(true);
      setParentId("");
    } catch (e) {
      setError(e instanceof ApiError ? e.localized(locale) : t("common.error"));
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title={t("nav.ac.studentParent")}
        subtitle="O‘quvchini ota-ona hisobiga biriktiring"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Students list */}
        <Card className="max-h-[70vh] overflow-y-auto p-2">
          {students.isLoading ? (
            <div className="grid place-items-center py-20">
              <Spinner />
            </div>
          ) : students.rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-muted">
              {t("common.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {students.rows.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentId(s.id);
                      setDone(false);
                      setError(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      studentId === s.id ? "bg-accent/10" : "hover:bg-parchment",
                    )}
                  >
                    <span className="flex-1">
                      <span className="block font-medium text-ink">{fullName(s)}</span>
                      <span className="block text-xs text-ink-muted">
                        {loc((s.currentClass as Record<string, unknown>)?.name)} ·{" "}
                        <span className="font-mono">{String(s.studentCode ?? "")}</span>
                      </span>
                    </span>
                    {studentId === s.id && <Check className="h-4 w-4 text-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Link form */}
        <Card className="h-fit p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Link2 className="h-4 w-4 text-accent" />
            Biriktirish
          </h3>

          <div className="mt-5 space-y-4">
            <Field label="O‘quvchi">
              <Input
                readOnly
                value={
                  studentId
                    ? fullName(students.rows.find((s) => s.id === studentId))
                    : ""
                }
                placeholder="Ro‘yxatdan tanlang"
                className="bg-parchment-deep"
              />
            </Field>

            <Field label="Ota-ona" htmlFor="parent">
              <select
                id="parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              >
                <option value="">Tanlang…</option>
                {parents.rows.map((p) => (
                  <option key={p.id} value={p.id}>
                    {String(p.fullName ?? p.login ?? p.id)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Munosabat" htmlFor="relation">
              <select
                id="relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              >
                {RELATIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-accent"
              />
              Asosiy vakil
            </label>

            {error && (
              <p className="rounded-lg border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative">
                {error}
              </p>
            )}
            {done && (
              <p className="rounded-lg border border-positive/30 bg-positive/8 px-3 py-2 text-sm text-positive">
                Muvaffaqiyatli biriktirildi
              </p>
            )}

            <Button
              variant="accent"
              className="w-full"
              loading={link.isPending}
              onClick={submit}
            >
              Biriktirish
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
