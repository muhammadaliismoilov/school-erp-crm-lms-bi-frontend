"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { useCreateStudent, type CreateStudentInput } from "@/lib/api/students";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

export default function NewStudentPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const createStudent = useCreateStudent();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentInput>();

  async function onSubmit(values: CreateStudentInput) {
    setServerError(null);
    try {
      await createStudent.mutateAsync({
        ...values,
        studentCode: values.studentCode.toUpperCase(),
        birthDate: values.birthDate || undefined,
        gender: values.gender || undefined,
      });
      router.push("/students");
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.localized(locale) : t("common.error"),
      );
    }
  }

  return (
    <div className="stagger mx-auto max-w-2xl">
      <Link
        href="/students"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("students.title")}
      </Link>

      <PageHeader title={t("students.new")} />

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={t("students.firstName")}
              htmlFor="firstName"
              error={errors.firstName && t("common.error")}
            >
              <Input
                id="firstName"
                {...register("firstName", { required: true, maxLength: 80 })}
              />
            </Field>
            <Field
              label={t("students.lastName")}
              htmlFor="lastName"
              error={errors.lastName && t("common.error")}
            >
              <Input
                id="lastName"
                {...register("lastName", { required: true, maxLength: 80 })}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="O‘quvchi kodi"
              htmlFor="studentCode"
              error={errors.studentCode && "ST-2026-0001"}
            >
              <Input
                id="studentCode"
                placeholder="ST-2026-0001"
                className="font-mono uppercase"
                {...register("studentCode", {
                  required: true,
                  pattern: /^[A-Za-z0-9-]{3,40}$/,
                })}
              />
            </Field>
            <Field label="Tug‘ilgan sana" htmlFor="birthDate">
              <Input id="birthDate" type="date" {...register("birthDate")} />
            </Field>
          </div>

          <Field label="Jinsi" htmlFor="gender">
            <select
              id="gender"
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              {...register("gender")}
            >
              <option value="">—</option>
              <option value="male">Erkak</option>
              <option value="female">Ayol</option>
            </select>
          </Field>

          {serverError && (
            <p className="rounded-lg border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("common.save")}
            </Button>
            <Link href="/students">
              <Button type="button" variant="secondary">
                {t("common.cancel")}
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
