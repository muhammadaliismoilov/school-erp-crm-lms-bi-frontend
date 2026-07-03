"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, GraduationCap, X } from "lucide-react";
import {
  DEGREE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  TEACHER_STATUS_LABELS,
  useCreateTeacher,
  useUpdateTeacher,
  type Teacher,
  type TeacherInput,
  type TeacherWorkType,
} from "@/lib/api/hr-teachers";
import { QUALIFICATION_CATEGORIES, QUALIFICATION_LABELS, type QualificationCategory } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/ui/date-input";
import { Drawer } from "@/components/ui/drawer";
import { useUploadFile, ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from "@/lib/api/files";

// Malaka toifasi xodim (StaffMember) bilan yagona enum — rasmiy sxema (past→yuqori).
const CATEGORY_OPTIONS: { value: QualificationCategory; label: string }[] =
  QUALIFICATION_CATEGORIES.map((value) => ({ value, label: QUALIFICATION_LABELS[value] }));

const ROLE_FIELDS = [
  { key: "isSubjectTeacher", label: "Fan o'qituvchisi" },
  { key: "isAssistantTeacher", label: "Yordamchi o'qituvchi" },
  { key: "isMbr", label: "MBR" },
  { key: "isExtraLesson", label: "Qo'shimcha dars" },
  { key: "isClassLeader", label: "Sinf rahbari" },
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  gender: "" | "male" | "female";
  birthDate: string;
  documentNumber: string;
  pinfl: string;
  phone: string;
  photoUrl: string;
  workType: TeacherWorkType;
  degree: TeacherInput["degree"] | "";
  employmentType: TeacherInput["employmentType"];
  status: TeacherInput["status"];
  category: QualificationCategory | "";
  experienceYears: number | null;
  ratePerLesson: number | null;
  startDate: string;
  endDate: string;
  isSubjectTeacher: boolean;
  isAssistantTeacher: boolean;
  isMbr: boolean;
  isExtraLesson: boolean;
  isClassLeader: boolean;
  note: string;
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  middleName: "",
  gender: "",
  birthDate: "",
  documentNumber: "",
  pinfl: "",
  phone: "",
  photoUrl: "",
  workType: "full",
  degree: "",
  employmentType: "primary",
  status: "active",
  category: "",
  experienceYears: null,
  ratePerLesson: null,
  startDate: "",
  endDate: "",
  isSubjectTeacher: true,
  isAssistantTeacher: false,
  isMbr: false,
  isExtraLesson: false,
  isClassLeader: false,
  note: "",
};

/**
 * O'qituvchi yaratish/tahrirlash formasi (Drawer). O'qituvchilar ro'yxatidan ham,
 * xodim kartochkasidan ham ochiladi — shu sababli mustaqil komponent.
 */
export function TeacherDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Teacher | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const uploadPhoto = useUploadFile();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlash imkoni uchun
    if (!file) return;
    setPhotoError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError("Faqat rasm fayli (PNG, JPEG, WEBP)");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setPhotoError("Rasm hajmi 5 MB dan oshmasligi kerak");
      return;
    }
    try {
      const uploaded = await uploadPhoto.mutateAsync(file);
      setForm((prev) => ({ ...prev, photoUrl: uploaded.url ?? prev.photoUrl }));
    } catch {
      setPhotoError("Rasm yuklashda xatolik");
    }
  }

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        firstName: editing.firstName,
        lastName: editing.lastName,
        middleName: editing.middleName ?? "",
        gender: editing.gender ?? "",
        birthDate: editing.birthDate ?? "",
        documentNumber: editing.documentNumber ?? "",
        pinfl: editing.pinfl ?? "",
        phone: editing.phone ?? "",
        photoUrl: editing.photoUrl ?? "",
        workType: editing.workType,
        degree: editing.degree ?? "",
        employmentType: editing.employmentType,
        status: editing.status,
        category: editing.category ?? "",
        experienceYears: editing.experienceYears,
        ratePerLesson: Number(editing.ratePerLesson) || 0,
        startDate: editing.startDate ?? "",
        endDate: editing.endDate ?? "",
        isSubjectTeacher: editing.isSubjectTeacher,
        isAssistantTeacher: editing.isAssistantTeacher,
        isMbr: editing.isMbr,
        isExtraLesson: editing.isExtraLesson,
        isClassLeader: editing.isClassLeader,
        note: editing.note ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Ism va familiyani kiriting");
      return;
    }
    if (form.pinfl && !/^\d{14}$/.test(form.pinfl)) {
      setError("JSHSHIR 14 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    const payload: TeacherInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || undefined,
      gender: form.gender || undefined,
      birthDate: form.birthDate || undefined,
      documentNumber: form.documentNumber.trim() || undefined,
      pinfl: form.pinfl.trim() || undefined,
      phone: form.phone.trim() || undefined,
      photoUrl: form.photoUrl.trim() || undefined,
      workType: form.workType,
      degree: form.degree || undefined,
      employmentType: form.employmentType,
      status: form.status,
      category: form.category || undefined,
      experienceYears: form.experienceYears ?? undefined,
      ratePerLesson: form.ratePerLesson ?? undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isSubjectTeacher: form.isSubjectTeacher,
      isAssistantTeacher: form.isAssistantTeacher,
      isMbr: form.isMbr,
      isExtraLesson: form.isExtraLesson,
      isClassLeader: form.isClassLeader,
      note: form.note.trim() || undefined,
    };
    try {
      if (editing) {
        await updateTeacher.mutateAsync({ id: editing.id, input: payload });
        onSaved("O'qituvchi yangilandi");
      } else {
        await createTeacher.mutateAsync(payload);
        onSaved("O'qituvchi yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createTeacher.isPending || updateTeacher.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "O'qituvchini yangilash" : "O'qituvchi yaratish"}
      subtitle="Shaxsiy ma'lumotlar"
      icon={<GraduationCap className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            {editing ? "Yangilash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="group relative h-24 w-24 overflow-hidden rounded-full border border-line bg-surface transition-colors hover:border-amber focus-visible:focus-ring"
            aria-label="Rasm yuklash"
          >
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="Xodim rasmi" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-ink-muted">
                <Camera className="h-7 w-7" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handlePhotoChange}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">
              {uploadPhoto.isPending ? "Yuklanmoqda..." : "Rasm (FaceID davomati uchun)"}
            </span>
            {form.photoUrl && !uploadPhoto.isPending && (
              <button
                type="button"
                onClick={() => set("photoUrl", "")}
                className="inline-flex items-center gap-0.5 text-xs text-negative hover:underline"
              >
                <X className="h-3 w-3" /> O'chirish
              </button>
            )}
          </div>
          {photoError && <span className="text-xs text-negative">{photoError}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Familiya" required>
            <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Familiya" />
          </Field>
          <Field label="Ism" required>
            <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Ism" />
          </Field>
          <Field label="Otasining ismi">
            <Input value={form.middleName} onChange={(e) => set("middleName", e.target.value)} placeholder="Otasining ismi" />
          </Field>
          <Field label="Jinsi">
            <Select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value as FormState["gender"])}
              options={[
                { value: "", label: "Tanlang" },
                { value: "male", label: "Erkak" },
                { value: "female", label: "Ayol" },
              ]}
            />
          </Field>
          <Field label="Hujjat raqami">
            <Input value={form.documentNumber} onChange={(e) => set("documentNumber", e.target.value)} placeholder="AA1234567" />
          </Field>
          <Field label="JSHSHIR (PINFL)">
            <Input
              value={form.pinfl}
              onChange={(e) => set("pinfl", e.target.value.replace(/\D/g, "").slice(0, 14))}
              placeholder="14 ta raqam"
            />
          </Field>
          <Field label="Telefon">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998 XX XXX XX XX" />
          </Field>
          <Field label="Tug'ilgan sana">
            <DateInput value={form.birthDate} onChange={(iso) => set("birthDate", iso)} />
          </Field>
        </div>

        <SectionTitle>Ish ma'lumotlari</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ish turi" required>
            <Select
              value={form.workType}
              onChange={(e) => set("workType", e.target.value as TeacherWorkType)}
              options={[
                { value: "full", label: "To'liq" },
                { value: "hourly", label: "Soatbay" },
              ]}
            />
          </Field>
          <Field label="Daraja">
            <Select
              value={form.degree ?? ""}
              onChange={(e) => set("degree", (e.target.value || "") as FormState["degree"])}
              options={[
                { value: "", label: "Tanlang" },
                ...Object.entries(DEGREE_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
          </Field>
          <Field label="Ishlash turi" required>
            <Select
              value={form.employmentType}
              onChange={(e) => set("employmentType", e.target.value as FormState["employmentType"])}
              options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Field>
          <Field label="Ish statusi" required>
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value as FormState["status"])}
              options={Object.entries(TEACHER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Field>
          <Field label="Toifa">
            <Select
              value={form.category}
              onChange={(e) => set("category", e.target.value as QualificationCategory | "")}
              options={[{ value: "", label: "Tanlang" }, ...CATEGORY_OPTIONS]}
            />
          </Field>
          <Field label="Tajriba (yil)">
            <NumberInput value={form.experienceYears} onChange={(v) => set("experienceYears", v)} placeholder="0" />
          </Field>
          <Field label="Dars uchun stavka">
            <NumberInput value={form.ratePerLesson} onChange={(v) => set("ratePerLesson", v)} placeholder="0" />
          </Field>
          <Field label="Ish boshlagan sana">
            <DateInput value={form.startDate} onChange={(iso) => set("startDate", iso)} />
          </Field>
          <Field label="Ish tugagan sana">
            <DateInput value={form.endDate} onChange={(iso) => set("endDate", iso)} />
          </Field>
        </div>

        <SectionTitle>Qo'shimcha ma'lumotlar</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_FIELDS.map((r) => (
            <label
              key={r.key}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5"
            >
              <Switch checked={form[r.key]} onCheckedChange={(v) => set(r.key, v)} aria-label={r.label} />
              <span className="text-sm text-ink">{r.label}</span>
            </label>
          ))}
        </div>

        <Field label="Izoh">
          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            rows={3}
            placeholder="Izoh kiriting..."
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-negative">*</span>}
      </label>
      {children}
    </div>
  );
}
