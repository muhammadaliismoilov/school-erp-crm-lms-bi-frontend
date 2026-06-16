"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useEnrollLead, type EnrollStudentInput, type Lead } from "@/lib/api/crm";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Props {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onEnrolled: (studentCode: string) => void;
}

type FormState = {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  gender: "" | "male" | "female";
  nationality: string;
  birthCertificateSeries: string;
  birthCertificateNumber: string;
  passport: string;
  jshshir: string;
  passportIssuedDate: string;
  guardianFullName: string;
  guardianRelation: string;
  guardianPassport: string;
  guardianJshshir: string;
  guardianPhone: string;
  region: string;
  district: string;
  address: string;
  personalPhone: string;
};

const EMPTY: FormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  birthDate: "",
  gender: "",
  nationality: "",
  birthCertificateSeries: "",
  birthCertificateNumber: "",
  passport: "",
  jshshir: "",
  passportIssuedDate: "",
  guardianFullName: "",
  guardianRelation: "",
  guardianPassport: "",
  guardianJshshir: "",
  guardianPhone: "+998",
  region: "",
  district: "",
  address: "",
  personalPhone: "",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-display text-base font-semibold text-ink">{children}</h4>;
}

export function LeadEnrollDrawer({ open, lead, onClose, onEnrolled }: Props) {
  const { t } = useI18n();
  const enroll = useEnrollLead();
  const [f, setF] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Prefill name/phone from the lead so the operator types less.
    const [first, ...rest] = (lead?.fullName ?? "").trim().split(/\s+/);
    setF({
      ...EMPTY,
      firstName: lead?.firstName ?? first ?? "",
      lastName: lead?.lastName ?? rest.join(" ") ?? "",
      personalPhone: lead?.phone ?? "",
      guardianPhone: lead?.phone ?? "+998",
    });
    setError(null);
  }, [open, lead]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const genderOptions = [
    { value: "", label: t("common.select") },
    { value: "male", label: t("enroll.gender.male") },
    { value: "female", label: t("enroll.gender.female") },
  ];
  const relationOptions = [
    { value: "", label: t("common.select") },
    { value: "father", label: t("enroll.relation.father") },
    { value: "mother", label: t("enroll.relation.mother") },
    { value: "guardian", label: t("enroll.relation.guardian") },
  ];

  const FIELD_LABELS: Record<string, string> = {
    lastName: t("enroll.lastName"),
    firstName: t("enroll.firstName"),
    birthDate: t("enroll.birthDate"),
    birthCertificateSeries: t("enroll.certSeries"),
    birthCertificateNumber: t("enroll.certNumber"),
    guardianFullName: t("enroll.guardianName"),
    guardianPhone: t("enroll.guardianPhone"),
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!lead) return;
    if (!f.lastName.trim()) return setError(t("enroll.err.lastName"));
    if (!f.firstName.trim()) return setError(t("enroll.err.firstName"));
    if (!f.birthDate) return setError(t("enroll.err.birthDate"));
    if (!f.birthCertificateSeries.trim() || !f.birthCertificateNumber.trim())
      return setError(t("enroll.err.cert"));
    if (!f.guardianFullName.trim()) return setError(t("enroll.err.guardianName"));
    if (!f.guardianPhone.trim()) return setError(t("enroll.err.guardianPhone"));

    const input: EnrollStudentInput = {
      lastName: f.lastName.trim(),
      firstName: f.firstName.trim(),
      birthDate: f.birthDate,
      birthCertificateSeries: f.birthCertificateSeries.trim(),
      birthCertificateNumber: f.birthCertificateNumber.trim(),
      guardianFullName: f.guardianFullName.trim(),
      guardianPhone: f.guardianPhone.trim(),
      ...(f.middleName.trim() ? { middleName: f.middleName.trim() } : {}),
      ...(f.gender ? { gender: f.gender } : {}),
      ...(f.nationality.trim() ? { nationality: f.nationality.trim() } : {}),
      ...(f.passport.trim() ? { passport: f.passport.trim() } : {}),
      ...(f.jshshir.trim() ? { jshshir: f.jshshir.trim() } : {}),
      ...(f.passportIssuedDate ? { passportIssuedDate: f.passportIssuedDate } : {}),
      ...(f.guardianRelation ? { guardianRelation: f.guardianRelation } : {}),
      ...(f.guardianPassport.trim() ? { guardianPassport: f.guardianPassport.trim() } : {}),
      ...(f.guardianJshshir.trim() ? { guardianJshshir: f.guardianJshshir.trim() } : {}),
      ...(f.region.trim() ? { region: f.region.trim() } : {}),
      ...(f.district.trim() ? { district: f.district.trim() } : {}),
      ...(f.address.trim() ? { address: f.address.trim() } : {}),
      ...(f.personalPhone.trim() ? { personalPhone: f.personalPhone.trim() } : {}),
    };

    try {
      const result = await enroll.mutateAsync({ leadId: lead.id, input });
      onEnrolled(result.studentCode);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detailedMessage("uz", FIELD_LABELS) : t("common.error"));
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("enroll.title")}
      subtitle={t("enroll.subtitle")}
      icon={<GraduationCap className="h-5 w-5" />}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={enroll.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="enroll-form" loading={enroll.isPending}>
            {t("enroll.submit")}
          </Button>
        </>
      }
    >
      <form id="enroll-form" onSubmit={handleSubmit} className="space-y-6">
        {/* O'quvchining shaxsiy ma'lumotlari */}
        <section className="space-y-4">
          <SectionTitle>{t("enroll.section.personal")}</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`${t("enroll.lastName")} *`} htmlFor="en-last">
              <Input id="en-last" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} maxLength={80} />
            </Field>
            <Field label={`${t("enroll.firstName")} *`} htmlFor="en-first">
              <Input id="en-first" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} maxLength={80} />
            </Field>
            <Field label={t("enroll.middleName")} htmlFor="en-middle">
              <Input id="en-middle" value={f.middleName} onChange={(e) => set("middleName", e.target.value)} maxLength={80} />
            </Field>
            <Field label={`${t("enroll.birthDate")} *`} htmlFor="en-birth">
              <DatePicker id="en-birth" value={f.birthDate} onChange={(iso) => set("birthDate", iso)} max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label={t("enroll.gender")} htmlFor="en-gender">
              <Select id="en-gender" value={f.gender} onChange={(e) => set("gender", e.target.value as FormState["gender"])} options={genderOptions} />
            </Field>
            <Field label={t("enroll.nationality")} htmlFor="en-nat">
              <Input id="en-nat" value={f.nationality} onChange={(e) => set("nationality", e.target.value)} maxLength={60} />
            </Field>
          </div>
        </section>

        {/* Tug'ilganlik haqida guvohnoma */}
        <section className="space-y-4">
          <SectionTitle>{t("enroll.section.cert")}</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`${t("enroll.certSeries")} *`} htmlFor="en-cs">
              <Input id="en-cs" value={f.birthCertificateSeries} onChange={(e) => set("birthCertificateSeries", e.target.value)} maxLength={20} />
            </Field>
            <Field label={`${t("enroll.certNumber")} *`} htmlFor="en-cn">
              <Input id="en-cn" value={f.birthCertificateNumber} onChange={(e) => set("birthCertificateNumber", e.target.value)} maxLength={40} />
            </Field>
          </div>
        </section>

        {/* Passport ma'lumotlari */}
        <section className="space-y-4">
          <SectionTitle>{t("enroll.section.passport")}</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("enroll.passport")} htmlFor="en-pass">
              <Input id="en-pass" value={f.passport} onChange={(e) => set("passport", e.target.value)} maxLength={40} />
            </Field>
            <Field label={t("enroll.jshshir")} htmlFor="en-jsh">
              <Input id="en-jsh" value={f.jshshir} onChange={(e) => set("jshshir", e.target.value)} maxLength={32} />
            </Field>
            <Field label={t("enroll.passportIssued")} htmlFor="en-pid">
              <DatePicker id="en-pid" value={f.passportIssuedDate} onChange={(iso) => set("passportIssuedDate", iso)} />
            </Field>
          </div>
        </section>

        {/* Ota-ona yoki vasiy */}
        <section className="space-y-4">
          <SectionTitle>{t("enroll.section.guardian")}</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`${t("enroll.guardianName")} *`} htmlFor="en-gn">
              <Input id="en-gn" value={f.guardianFullName} onChange={(e) => set("guardianFullName", e.target.value)} maxLength={160} />
            </Field>
            <Field label={t("enroll.guardianRelation")} htmlFor="en-gr">
              <Select id="en-gr" value={f.guardianRelation} onChange={(e) => set("guardianRelation", e.target.value)} options={relationOptions} />
            </Field>
            <Field label={t("enroll.guardianPassport")} htmlFor="en-gp">
              <Input id="en-gp" value={f.guardianPassport} onChange={(e) => set("guardianPassport", e.target.value)} maxLength={40} />
            </Field>
            <Field label={t("enroll.guardianJshshir")} htmlFor="en-gj">
              <Input id="en-gj" value={f.guardianJshshir} onChange={(e) => set("guardianJshshir", e.target.value)} maxLength={32} />
            </Field>
            <Field label={`${t("enroll.guardianPhone")} *`} htmlFor="en-gph">
              <Input id="en-gph" value={f.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} placeholder="+998901234567" />
            </Field>
          </div>
        </section>

        {/* Yashash manzili */}
        <section className="space-y-4">
          <SectionTitle>{t("enroll.section.address")}</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("enroll.region")} htmlFor="en-reg">
              <Input id="en-reg" value={f.region} onChange={(e) => set("region", e.target.value)} maxLength={80} />
            </Field>
            <Field label={t("enroll.district")} htmlFor="en-dis">
              <Input id="en-dis" value={f.district} onChange={(e) => set("district", e.target.value)} maxLength={80} />
            </Field>
            <div className="col-span-2">
              <Field label={t("enroll.address")} htmlFor="en-addr">
                <Input id="en-addr" value={f.address} onChange={(e) => set("address", e.target.value)} maxLength={500} />
              </Field>
            </div>
          </div>
        </section>

        {/* Bog'lanish uchun */}
        <section className="space-y-4">
          <SectionTitle>{t("enroll.section.contact")}</SectionTitle>
          <Field label={t("enroll.personalPhone")} htmlFor="en-pph">
            <Input id="en-pph" value={f.personalPhone} onChange={(e) => set("personalPhone", e.target.value)} placeholder="+998 ## ### ## ##" />
          </Field>
        </section>

        {error && (
          <p className="whitespace-pre-line rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </form>
    </Drawer>
  );
}
