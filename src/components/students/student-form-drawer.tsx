"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { GraduationCap } from "lucide-react";
import {
  useCreateStudent,
  useUpdateStudent,
  type ExtraDocuments,
  type Student,
  type StudentInput,
} from "@/lib/api/students";
import { useClassList } from "@/lib/api/classes";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { formatMoney } from "@/lib/utils";
import { PlanComparison } from "./plan-comparison";
import type { PlanCode } from "@/lib/api/payment-plans";

interface FormValues {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  nationalId: string;
  gender: "" | "male" | "female";
  preferredLanguage: "uz" | "ru" | "en";
  currentClassId: string;
  studentCode: string;
  contractNumber: string;
  region: string;
  district: string;
  address: string;
  monthlyFee: number;
  discountType: "percent" | "amount";
  discountValue: number;
  paymentPlan: "" | "yearly_1x" | "split_2" | "split_3" | "monthly";
  /** Gibrid: shu o'quvchiga maxsus reja chegirmasi (global config ustidan). */
  planOverrideEnabled: boolean;
  planDiscountOverrideType: "percent" | "amount";
  planDiscountOverrideValue: number;
}

const EXTRA_DOCS: { key: keyof ExtraDocuments; label: string }[] = [
  { key: "tabelGuvohnoma", label: "Tabel guvohnomasi" },
  { key: "passportNusxa", label: "Ota-onaning passport nusxasi" },
  { key: "tibbiyDaftarcha", label: "Tibbiy ko‘rik daftarchasi" },
  { key: "rasmlar", label: "Rasmlar" },
  { key: "baholarVaraqasi", label: "Baholar varaqasi" },
];

const LANGUAGES = [
  { value: "uz", label: "O‘zbek" },
  { value: "ru", label: "Rus" },
  { value: "en", label: "Ingliz" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Tahrirlash uchun mavjud o‘quvchi; bo‘sh bo‘lsa — yangi yaratish. */
  student?: Student | null;
  onSaved?: () => void;
}

function toDefaults(student?: Student | null): FormValues {
  return {
    lastName: student?.lastName ?? "",
    firstName: student?.firstName ?? "",
    middleName: student?.middleName ?? "",
    birthDate: student?.birthDate ?? "",
    nationalId: student?.nationalId ?? "",
    gender: (student?.gender as FormValues["gender"]) ?? "",
    preferredLanguage: (student?.preferredLanguage as FormValues["preferredLanguage"]) ?? "uz",
    currentClassId: student?.currentClassId ?? "",
    studentCode: student?.studentCode ?? "",
    contractNumber: student?.contractNumber ?? "",
    region: student?.region ?? "",
    district: student?.district ?? "",
    address: student?.address ?? "",
    monthlyFee: Number(student?.monthlyFee ?? 0),
    discountType: student?.discountType ?? "percent",
    discountValue: Number(student?.discountValue ?? student?.discountPercent ?? 0),
    paymentPlan: (student?.paymentPlan as FormValues["paymentPlan"]) ?? "",
    planOverrideEnabled: Boolean(student?.planDiscountOverrideType),
    planDiscountOverrideType: (student?.planDiscountOverrideType as "percent" | "amount") ?? "percent",
    planDiscountOverrideValue: Number(student?.planDiscountOverrideValue ?? 0),
  };
}

export function StudentFormDrawer({ open, onClose, student, onSaved }: Props) {
  const { t, locale } = useI18n();
  const isEdit = Boolean(student);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const { data: classData } = useClassList();
  const [serverError, setServerError] = useState<string | null>(null);
  const [extraDocs, setExtraDocs] = useState<ExtraDocuments>({});

  const classOptions = useMemo(() => {
    const items = classData?.items ?? [];
    return [...items]
      .sort((a, b) => a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section))
      .map((c) => ({ value: c.id, label: `${c.gradeLevel}-${c.section}` }));
  }, [classData]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toDefaults(student) });

  useEffect(() => {
    if (open) {
      reset(toDefaults(student));
      setExtraDocs(student?.extraDocuments ?? {});
      setServerError(null);
    }
  }, [open, student, reset]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const input: StudentInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName.trim() || undefined,
      birthDate: values.birthDate || undefined,
      nationalId: values.nationalId.trim() || undefined,
      gender: values.gender || undefined,
      preferredLanguage: values.preferredLanguage,
      currentClassId: values.currentClassId || undefined,
      studentCode: values.studentCode.trim().toUpperCase() || undefined,
      contractNumber: values.contractNumber.trim() || undefined,
      region: values.region.trim() || undefined,
      district: values.district.trim() || undefined,
      address: values.address.trim() || undefined,
      monthlyFee: Number(values.monthlyFee) || 0,
      discountType: values.discountType,
      discountValue: Number(values.discountValue) || 0,
      paymentPlan: values.paymentPlan || undefined,
      // Gibrid: override yoqilgan bo'lsa yuboriladi, aks holda null bilan tozalanadi.
      planDiscountOverrideType: values.planOverrideEnabled ? values.planDiscountOverrideType : null,
      planDiscountOverrideValue: values.planOverrideEnabled ? Number(values.planDiscountOverrideValue) || 0 : null,
      extraDocuments: extraDocs,
    };

    try {
      if (isEdit && student) {
        await updateStudent.mutateAsync({ id: student.id, input });
      } else {
        await createStudent.mutateAsync(input);
      }
      onSaved?.();
      onClose();
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.localized(locale) : t("common.error"),
      );
    }
  }

  function toggleDoc(key: keyof ExtraDocuments) {
    setExtraDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "O‘quvchini tahrirlash" : "O‘quvchi qo‘shish"}
      subtitle="To‘liq profil ma'lumotlarini kiriting"
      icon={<GraduationCap className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="student-form" loading={isSubmitting}>
            {isEdit ? t("common.save") : "Yaratish"}
          </Button>
        </div>
      }
    >
      <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Umumiy */}
        <Section title="Umumiy">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Familiya" htmlFor="lastName" error={errors.lastName && "Majburiy"}>
              <Input id="lastName" {...register("lastName", { required: true, maxLength: 80 })} />
            </Field>
            <Field label="Ism" htmlFor="firstName" error={errors.firstName && "Majburiy"}>
              <Input id="firstName" {...register("firstName", { required: true, maxLength: 80 })} />
            </Field>
          </div>
          <Field label="Otasining ismi" htmlFor="middleName">
            <Input id="middleName" {...register("middleName", { maxLength: 80 })} />
          </Field>
        </Section>

        {/* Asosiy */}
        <Section title="Asosiy ma'lumotlar">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tug‘ilgan sana" htmlFor="birthDate">
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <DateInput id="birthDate" value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field label="Hujjat raqami (JSHSHIR)" htmlFor="nationalId">
              <Input id="nationalId" {...register("nationalId", { maxLength: 32 })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jinsi" htmlFor="gender">
              <Select
                id="gender"
                placeholder="—"
                options={[
                  { value: "male", label: "Erkak" },
                  { value: "female", label: "Ayol" },
                ]}
                {...register("gender")}
              />
            </Field>
            <Field label="Tanlangan til" htmlFor="preferredLanguage">
              <Select id="preferredLanguage" options={LANGUAGES} {...register("preferredLanguage")} />
            </Field>
          </div>
        </Section>

        {/* O'qish */}
        <Section title="O‘qish ma'lumotlari">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sinf" htmlFor="currentClassId">
              <Select
                id="currentClassId"
                placeholder="Sinf tanlang"
                options={classOptions}
                {...register("currentClassId")}
              />
            </Field>
            <Field label="ID raqam" htmlFor="studentCode">
              <Input
                id="studentCode"
                placeholder="Avtomatik (ST-2026-...)"
                className="font-mono uppercase"
                {...register("studentCode", { pattern: /^[A-Za-z0-9-]{3,40}$/ })}
              />
            </Field>
          </div>
          <Field label="Shartnoma raqami" htmlFor="contractNumber">
            <Input id="contractNumber" {...register("contractNumber", { maxLength: 60 })} />
          </Field>
        </Section>

        {/* Manzil */}
        <Section title="Manzil">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shahar / viloyat" htmlFor="region">
              <Input id="region" {...register("region", { maxLength: 80 })} />
            </Field>
            <Field label="Tuman" htmlFor="district">
              <Input id="district" {...register("district", { maxLength: 80 })} />
            </Field>
          </div>
          <Field label="To‘liq manzil" htmlFor="address">
            <Input id="address" {...register("address", { maxLength: 500 })} />
          </Field>
        </Section>

        {/* To'lov: oylik tarif va chegirma */}
        <Section title="To‘lov (oylik tarif va chegirma)">
          <BillingFields control={control} />
        </Section>

        {/* Qo'shimcha hujjatlar */}
        <Section title="Qo‘shimcha hujjatlar">
          <div className="grid gap-2 sm:grid-cols-2">
            {EXTRA_DOCS.map((doc) => {
              const checked = Boolean(extraDocs[doc.key]);
              return (
                <button
                  key={doc.key}
                  type="button"
                  onClick={() => toggleDoc(doc.key)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    checked
                      ? "border-accent/40 bg-accent/10 text-ink"
                      : "border-line bg-surface text-ink-muted hover:border-accent/30"
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                      checked ? "border-accent bg-accent text-white" : "border-line"
                    }`}
                  >
                    {checked && "✓"}
                  </span>
                  {doc.label}
                </button>
              );
            })}
          </div>
        </Section>

        {serverError && (
          <p className="rounded-lg border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative">
            {serverError}
          </p>
        )}
      </form>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="label border-b border-line pb-1.5">{title}</h4>
      {children}
    </section>
  );
}

/**
 * Oylik tarif + chegirma (foiz/so'm) maydonlari. Alohida komponent — `useWatch`
 * faqat shu blokni qayta render qiladi, butun formani emas. Chegirmadan keyingi
 * oylik to'lov jonli ko'rsatiladi.
 */
function BillingFields({ control }: { control: Control<FormValues> }) {
  const [
    monthlyFee,
    discountType,
    discountValue,
    paymentPlan,
    overrideEnabled,
    overrideType,
    overrideValue,
  ] = useWatch({
    control,
    name: [
      "monthlyFee",
      "discountType",
      "discountValue",
      "paymentPlan",
      "planOverrideEnabled",
      "planDiscountOverrideType",
      "planDiscountOverrideValue",
    ],
  });
  const fee = Number(monthlyFee) || 0;
  const value = Number(discountValue) || 0;
  const discount = discountType === "percent" ? (fee * value) / 100 : value;
  const effective = Math.max(fee - discount, 0);
  // Override faqat tanlangan rejaga qo'llanadi (compareForStudent bilan bir xil mantiq).
  const activeOverride =
    overrideEnabled && paymentPlan
      ? { overridePlan: paymentPlan as PlanCode, overrideType, overrideValue: Number(overrideValue) || 0 }
      : {};

  return (
    <div className="space-y-3">
      <Field label="Oylik tarif (so‘m)">
        <Controller
          control={control}
          name="monthlyFee"
          render={({ field }) => (
            <NumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="0" />
          )}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Chegirma turi">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line">
                {(["percent", "amount"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => field.onChange(t)}
                    className={`py-2 text-sm font-medium transition-colors ${
                      field.value === t ? "bg-accent text-accent-fg" : "bg-surface text-ink-muted hover:text-ink"
                    }`}
                  >
                    {t === "percent" ? "Foiz (%)" : "So‘m"}
                  </button>
                ))}
              </div>
            )}
          />
        </Field>
        <Field label={discountType === "percent" ? "Chegirma (%)" : "Chegirma (so‘m)"}>
          <Controller
            control={control}
            name="discountValue"
            render={({ field }) => (
              <NumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="0" />
            )}
          />
        </Field>
      </div>
      <p className="text-sm text-ink-muted">
        Chegirmadan keyin oylik:{" "}
        <span className="font-semibold text-ink tnum">{formatMoney(effective)}</span>
      </p>

      <div className="space-y-2 pt-1">
        <p className="text-sm font-medium text-ink">To‘lov rejasi</p>
        <Controller
          control={control}
          name="paymentPlan"
          render={({ field }) => (
            <PlanComparison
              monthlyFee={fee}
              discountType={discountType}
              discountValue={value}
              value={field.value || null}
              onSelect={(plan) => field.onChange(plan)}
              {...activeOverride}
            />
          )}
        />
      </div>

      {/* Gibrid: bu o'quvchiga maxsus reja chegirmasi (ixtiyoriy — bo'sh bo'lsa global qo'llanadi) */}
      <div className="space-y-3 rounded-xl border border-dashed border-line p-3">
        <Controller
          control={control}
          name="planOverrideEnabled"
          render={({ field }) => (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span>
                <span className="font-medium text-ink">Bu o‘quvchiga maxsus reja chegirmasi</span>
                <span className="block text-xs text-ink-muted">
                  Bo‘sh qoldirilsa maktab bo‘yicha umumiy (global) chegirma qo‘llanadi.
                </span>
              </span>
            </label>
          )}
        />
        {overrideEnabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Override turi">
              <Controller
                control={control}
                name="planDiscountOverrideType"
                render={({ field }) => (
                  <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line">
                    {(["percent", "amount"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={`py-2 text-sm font-medium transition-colors ${
                          field.value === t ? "bg-accent text-accent-fg" : "bg-surface text-ink-muted hover:text-ink"
                        }`}
                      >
                        {t === "percent" ? "Foiz (%)" : "So‘m"}
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field>
            <Field label={overrideType === "percent" ? "Override chegirma (%)" : "Override chegirma (so‘m)"}>
              <Controller
                control={control}
                name="planDiscountOverrideValue"
                render={({ field }) => (
                  <NumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="0" />
                )}
              />
            </Field>
            {!paymentPlan && (
              <p className="text-xs text-amber-600 sm:col-span-2">
                Override qo‘llanishi uchun yuqorida to‘lov rejasini tanlang.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
