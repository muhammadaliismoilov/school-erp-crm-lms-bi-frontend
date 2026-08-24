"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import {
  PAYMENT_PERIOD_UNITS,
  PAYMENT_START_STRATEGIES,
  SCHOOL_TYPES,
  WORK_DAYS,
  useCreateSchool,
  useUpdateSchool,
  type GroupMonthlyPayment,
  type School,
  type SchoolInput,
} from "@/lib/api/schools";
import { ApiError } from "@/lib/api/types";
import { COUNTRIES, UZ_REGIONS, districtsForRegion } from "@/lib/data/uz-regions";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { PhoneInput, trimmedUzPhone, UZ_PHONE_PREFIX } from "@/components/ui/phone-input";
import { Modal } from "@/components/ui/modal";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserFormModal } from "@/components/users/user-form-modal";

interface FormState {
  name: string;
  legalName: string;
  country: string;
  region: string;
  district: string;
  address: string;
  websiteUrl: string;
  schoolType: SchoolInput["schoolType"];
  email: string;
  phone: string;
  totalCapacity: string;
  elementaryCapacity: string;
  upperCapacity: string;
  monthlyPayment: string;
  paymentStartStrategy: SchoolInput["paymentStartStrategy"];
  paymentPeriodUnit: SchoolInput["paymentPeriodUnit"];
  workDays: SchoolInput["workDays"];
  separateGroupPayments: boolean;
  groupMonthlyPayments: GroupMonthlyPayment[];
}

const emptyForm: FormState = {
  name: "",
  legalName: "",
  country: "UZ",
  region: "",
  district: "",
  address: "",
  websiteUrl: "",
  schoolType: "private",
  email: "",
  phone: UZ_PHONE_PREFIX,
  totalCapacity: "",
  elementaryCapacity: "",
  upperCapacity: "",
  monthlyPayment: "",
  paymentStartStrategy: "full_academic_year",
  paymentPeriodUnit: "year",
  workDays: "five_days",
  separateGroupPayments: false,
  groupMonthlyPayments: [],
};

function fromSchool(school: School): FormState {
  return {
    name: school.name ?? "",
    legalName: school.legalName ?? "",
    country: school.country ?? "UZ",
    region: school.region ?? "",
    district: school.district ?? "",
    address: school.address ?? "",
    websiteUrl: school.websiteUrl ?? "",
    schoolType: school.schoolType,
    email: school.email ?? "",
    phone: school.phone ?? UZ_PHONE_PREFIX,
    totalCapacity: String(school.capacities.total ?? ""),
    elementaryCapacity: String(school.capacities.elementary ?? ""),
    upperCapacity: String(school.capacities.upper ?? ""),
    monthlyPayment: school.payment.monthlyPayment ? String(school.payment.monthlyPayment) : "",
    paymentStartStrategy: school.payment.paymentStartStrategy,
    paymentPeriodUnit: school.payment.paymentPeriodUnit,
    workDays: school.payment.workDays,
    separateGroupPayments: school.payment.separateGroupPayments,
    groupMonthlyPayments: school.payment.groupMonthlyPayments ?? [],
  };
}

interface SchoolFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this school; otherwise it creates a new one. */
  school?: School | null;
}

export function SchoolFormModal({ open, onClose, school }: SchoolFormModalProps) {
  const { t, locale } = useI18n();
  const isEdit = Boolean(school);
  const create = useCreateSchool();
  const update = useUpdateSchool();
  const pending = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  // Yaratish ustasining 2-bosqichi: maktab saqlangach, uni butunlay yopib
  // qo'ymasdan, shu maktabning birinchi xodimi (direktor)ni ham hoziroq
  // yaratishni taklif qilamiz — aks holda yangi maktabda hech kim
  // (superadmindan boshqa) kira olmaydigan, "egasiz" holat qoladi.
  const [createdSchool, setCreatedSchool] = useState<School | null>(null);
  const [showDirectorForm, setShowDirectorForm] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(school ? fromSchool(school) : emptyForm);
      setError(null);
      setCreatedSchool(null);
      setShowDirectorForm(false);
    }
  }, [open, school]);

  function finishWizard() {
    setCreatedSchool(null);
    setShowDirectorForm(false);
    onClose();
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const total = Number(form.totalCapacity) || 0;
  const elementary = Number(form.elementaryCapacity) || 0;
  const upper = Number(form.upperCapacity) || 0;
  const capacityMismatch =
    form.totalCapacity !== "" && elementary + upper !== total;

  const countryOptions: SelectOption[] = useMemo(
    () => COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
    [],
  );
  const regionOptions: SelectOption[] = useMemo(
    () => UZ_REGIONS.map((r) => ({ value: r.name, label: r.name })),
    [],
  );
  const districtOptions: SelectOption[] = useMemo(
    () => districtsForRegion(form.region).map((d) => ({ value: d, label: d })),
    [form.region],
  );

  const typeOptions: SelectOption[] = useMemo(
    () => SCHOOL_TYPES.map((v) => ({ value: v, label: t(`schools.type.${v}`) })),
    [t],
  );
  const startOptions: SelectOption[] = useMemo(
    () => PAYMENT_START_STRATEGIES.map((v) => ({ value: v, label: t(`schools.paymentStart.${v}`) })),
    [t],
  );
  const periodOptions: SelectOption[] = useMemo(
    () => PAYMENT_PERIOD_UNITS.map((v) => ({ value: v, label: t(`schools.paymentPeriod.${v}`) })),
    [t],
  );
  const workDaysOptions: SelectOption[] = useMemo(
    () => WORK_DAYS.map((v) => ({ value: v, label: t(`schools.workDays.${v}`) })),
    [t],
  );

  const addGroup = () =>
    set("groupMonthlyPayments", [...form.groupMonthlyPayments, { groupName: "", amount: 0 }]);
  const updateGroup = (index: number, patch: Partial<GroupMonthlyPayment>) =>
    set(
      "groupMonthlyPayments",
      form.groupMonthlyPayments.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    );
  const removeGroup = (index: number) =>
    set(
      "groupMonthlyPayments",
      form.groupMonthlyPayments.filter((_, i) => i !== index),
    );

  function buildPayload(): SchoolInput {
    const trimmed = (s: string) => {
      const v = s.trim();
      return v.length ? v : undefined;
    };
    return {
      name: form.name.trim(),
      legalName: trimmed(form.legalName),
      country: form.country || "UZ",
      region: trimmed(form.region),
      district: trimmed(form.district),
      address: trimmed(form.address),
      websiteUrl: trimmed(form.websiteUrl),
      schoolType: form.schoolType,
      email: trimmed(form.email),
      phone: trimmedUzPhone(form.phone),
      monthlyPayment: form.monthlyPayment ? Number(form.monthlyPayment) : 0,
      paymentStartStrategy: form.paymentStartStrategy,
      paymentPeriodUnit: form.paymentPeriodUnit,
      workDays: form.workDays,
      separateGroupPayments: form.separateGroupPayments,
      groupMonthlyPayments: form.separateGroupPayments
        ? form.groupMonthlyPayments
            .filter((g) => g.groupName.trim().length > 0)
            .map((g) => ({ groupName: g.groupName.trim(), amount: Number(g.amount) || 0 }))
        : [],
      totalCapacity: total,
      elementaryCapacity: elementary,
      upperCapacity: upper,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError(t("schools.err.nameRequired"));
      return;
    }
    if (capacityMismatch) {
      setError(t("schools.err.capacityMismatch"));
      return;
    }

    const payload = buildPayload();
    try {
      if (school) {
        await update.mutateAsync({ id: school.id, input: payload });
        onClose();
      } else {
        const created = await create.mutateAsync(payload);
        // Darhol yopmaymiz — ustaning 2-bosqichi (direktor yaratish taklifi)
        // shu `created` maktab bo'yicha ko'rsatiladi.
        setCreatedSchool(created);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.localized(locale));
      } else {
        setError(t("common.error"));
      }
    }
  }

  // Usta, 2-bosqich: maktab endigina yaratildi — direktor yaratish taklif
  // qilinadi ("tasdiqlash" oynasi), keyin xohlasa `UserFormModal`ga o'tadi
  // (schoolId qulflangan holda). Uchala oyna ham har doim (shartsiz)
  // qaytariladi va faqat o'zining `open` bayrog'i bilan ko'rsatiladi/
  // yashiriladi — aks holda, masalan, direktor muvaffaqiyatli
  // yaratilgach `UserFormModal` butunlay unmount bo'lib, uning ichidagi
  // login/parolni ko'rsatuvchi `CredentialsModal` darhol yopilib qolar edi.
  return (
    <>
      <Modal
        open={open && !createdSchool}
        onClose={onClose}
        title={isEdit ? t("schools.edit") : t("schools.new")}
        subtitle={isEdit ? form.name : t("schools.subtitle")}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="school-form" loading={pending}>
              {isEdit ? t("common.save") : t("schools.create")}
            </Button>
          </>
        }
      >
        <form id="school-form" onSubmit={handleSubmit} className="space-y-7">
          {/* Asosiy ma'lumotlar */}
          <section className="space-y-4">
            <h4 className="label">{t("schools.section.basic")}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t("schools.f.name")} *`} htmlFor="s-name">
                <Input
                  id="s-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t("schools.f.name")}
                  required
                  maxLength={160}
                />
              </Field>
              <Field label={t("schools.f.legalName")} htmlFor="s-legal">
                <Input
                  id="s-legal"
                  value={form.legalName}
                  onChange={(e) => set("legalName", e.target.value)}
                  maxLength={255}
                />
              </Field>
              <Field label={t("schools.f.country")} htmlFor="s-country">
                <Select
                  id="s-country"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  options={countryOptions}
                />
              </Field>
              <Field label={t("schools.f.region")} htmlFor="s-region">
                <Select
                  id="s-region"
                  value={form.region}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, region: e.target.value, district: "" }))
                  }
                  options={regionOptions}
                  placeholder={t("schools.placeholder.region")}
                />
              </Field>
              <Field label={t("schools.f.district")} htmlFor="s-district">
                <Select
                  id="s-district"
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  options={districtOptions}
                  placeholder={t("schools.placeholder.district")}
                  disabled={!form.region}
                />
              </Field>
              <Field label={t("schools.f.type")} htmlFor="s-type">
                <Select
                  id="s-type"
                  value={form.schoolType}
                  onChange={(e) => set("schoolType", e.target.value as FormState["schoolType"])}
                  options={typeOptions}
                />
              </Field>
              <Field label={t("schools.f.address")} htmlFor="s-address">
                <Input
                  id="s-address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  maxLength={255}
                />
              </Field>
              <Field label={t("schools.f.website")} htmlFor="s-website">
                <Input
                  id="s-website"
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => set("websiteUrl", e.target.value)}
                  placeholder="https://"
                />
              </Field>
            </div>
          </section>

          {/* Kontakt */}
          <section className="space-y-4">
            <h4 className="label">{t("schools.section.contact")}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("schools.f.email")} htmlFor="s-email">
                <Input
                  id="s-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label={t("schools.f.phone")} htmlFor="s-phone">
                <PhoneInput
                  id="s-phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Sig'im */}
          <section className="space-y-4">
            <h4 className="label">{t("schools.section.capacity")}</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={`${t("schools.f.totalCapacity")} *`} htmlFor="s-total">
                <NumberInput
                  id="s-total"
                  value={form.totalCapacity}
                  onChange={(v) => set("totalCapacity", v == null ? "" : String(v))}
                />
              </Field>
              <Field label={`${t("schools.f.elementaryCapacity")} *`} htmlFor="s-elem">
                <NumberInput
                  id="s-elem"
                  value={form.elementaryCapacity}
                  onChange={(v) => set("elementaryCapacity", v == null ? "" : String(v))}
                />
              </Field>
              <Field label={`${t("schools.f.upperCapacity")} *`} htmlFor="s-upper">
                <NumberInput
                  id="s-upper"
                  value={form.upperCapacity}
                  onChange={(v) => set("upperCapacity", v == null ? "" : String(v))}
                />
              </Field>
            </div>
            {capacityMismatch && (
              <p className="text-xs text-negative">{t("schools.err.capacityMismatch")}</p>
            )}
          </section>

          {/* To'lov */}
          <section className="space-y-4">
            <h4 className="label">{t("schools.section.payment")}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("schools.f.monthlyPayment")} htmlFor="s-pay">
                <NumberInput
                  id="s-pay"
                  value={form.monthlyPayment}
                  onChange={(v) => set("monthlyPayment", v == null ? "" : String(v))}
                />
              </Field>
              <Field label={t("schools.f.workDays")} htmlFor="s-workdays">
                <Select
                  id="s-workdays"
                  value={form.workDays}
                  onChange={(e) => set("workDays", e.target.value as FormState["workDays"])}
                  options={workDaysOptions}
                />
              </Field>
              <Field label={t("schools.f.paymentStart")} htmlFor="s-start">
                <Select
                  id="s-start"
                  value={form.paymentStartStrategy}
                  onChange={(e) =>
                    set("paymentStartStrategy", e.target.value as FormState["paymentStartStrategy"])
                  }
                  options={startOptions}
                />
              </Field>
              <Field label={t("schools.f.paymentPeriod")} htmlFor="s-period">
                <Select
                  id="s-period"
                  value={form.paymentPeriodUnit}
                  onChange={(e) =>
                    set("paymentPeriodUnit", e.target.value as FormState["paymentPeriodUnit"])
                  }
                  options={periodOptions}
                />
              </Field>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-parchment/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{t("schools.f.separatePayments")}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{t("schools.f.separatePaymentsHint")}</p>
              </div>
              <Switch
                checked={form.separateGroupPayments}
                onCheckedChange={(v) => set("separateGroupPayments", v)}
                aria-label={t("schools.f.separatePayments")}
              />
            </div>

            {form.separateGroupPayments && (
              <div className="space-y-3">
                {form.groupMonthlyPayments.map((group, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <Field label={t("schools.f.groupName")} htmlFor={`g-name-${i}`}>
                      <Input
                        id={`g-name-${i}`}
                        value={group.groupName}
                        onChange={(e) => updateGroup(i, { groupName: e.target.value })}
                        maxLength={20}
                        placeholder="1A"
                      />
                    </Field>
                    <Field label={t("schools.f.groupAmount")} htmlFor={`g-amount-${i}`}>
                      <NumberInput
                        id={`g-amount-${i}`}
                        value={group.amount || ""}
                        onChange={(v) => updateGroup(i, { amount: v ?? 0 })}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGroup(i)}
                      aria-label={t("common.delete")}
                      className="mb-1.5 text-negative"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addGroup}>
                  <Plus className="h-4 w-4" />
                  {t("schools.addGroup")}
                </Button>
              </div>
            )}
          </section>

          {error && (
            <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
          )}
        </form>
      </Modal>

      <Modal
        open={open && Boolean(createdSchool) && !showDirectorForm}
        onClose={finishWizard}
        title={t("schools.wizard.title")}
        subtitle={createdSchool?.name}
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={finishWizard}>
              {t("schools.wizard.skip")}
            </Button>
            <Button type="button" onClick={() => setShowDirectorForm(true)}>
              <UserPlus className="h-4 w-4" />
              {t("schools.wizard.createDirector")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">{t("schools.wizard.body")}</p>
      </Modal>

      <UserFormModal
        open={open && Boolean(createdSchool) && showDirectorForm}
        onClose={finishWizard}
        defaultSchoolId={createdSchool?.id}
        defaultRoleName="director"
        lockSchool
      />
    </>
  );
}
