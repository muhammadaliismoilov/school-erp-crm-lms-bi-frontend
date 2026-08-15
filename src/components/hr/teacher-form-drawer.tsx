"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import {
  DEGREE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  TEACHER_STATUS_LABELS,
  useUpdateTeacher,
  type Teacher,
  type TeacherInput,
  type TeacherWorkType,
} from "@/lib/api/hr-teachers";
import { QUALIFICATION_CATEGORIES, QUALIFICATION_LABELS, type QualificationCategory } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/ui/date-input";
import { Drawer } from "@/components/ui/drawer";

// Malaka toifasi xodim (StaffMember) bilan yagona enum — rasmiy sxema (past→yuqori).
const CATEGORY_OPTIONS: { value: QualificationCategory; label: string }[] =
  QUALIFICATION_CATEGORIES.map((value) => ({ value, label: QUALIFICATION_LABELS[value] }));

// "Sinf rahbari" ATAYLAB yo'q (T-05): bu bayroq oylik dvigateliga ta'sir
// qilmaydi — haqiqiy biriktiruv "Sinf rahbarligi" sahifasida (/hr/class-leaderships)
// qilinadi. Shu yerda checkbox qoldirilsa, u hech narsaga ta'sir qilmaydigan
// yolg'on nazoratga aylanardi. `isClassLeader` maydonining o'zi FormState'da
// o'zgarishsiz uzatiladi — eski qiymat yo'qolmaydi, faqat endi tahrirlanmaydi.
const ROLE_FIELDS = [
  { key: "isSubjectTeacher", label: "Fan o'qituvchisi" },
  { key: "isAssistantTeacher", label: "Yordamchi o'qituvchi" },
  { key: "isMbr", label: "MBR" },
  { key: "isExtraLesson", label: "Qo'shimcha dars" },
] as const;

type FormState = {
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
 * O'qituvchining pedagogik maydonlarini tahrirlash (Drawer). Shaxsiy ma'lumot
 * (ism, telefon, rasm...) yagona manba — xodim formasida tahrirlanadi; yangi
 * o'qituvchi ham xodim formasi ("O'qituvchilik" bo'limi) orqali yaratiladi.
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
  const updateTeacher = useUpdateTeacher();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !editing) return;
    setForm({
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
    setError(null);
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!editing) return;
    const payload: Partial<TeacherInput> = {
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
      await updateTeacher.mutateAsync({ id: editing.id, input: payload });
      onSaved("O'qituvchi yangilandi");
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="O'qituvchini tahrirlash"
      subtitle={editing?.fullName ?? ""}
      icon={<GraduationCap className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={updateTeacher.isPending} onClick={submit}>
            Yangilash
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="rounded-lg border border-line bg-parchment/40 px-3 py-2 text-xs text-ink-muted">
          Shaxsiy ma'lumotlar (ism, telefon, rasm...) Xodimlar sahifasidagi tahrir formasida o'zgartiriladi.
        </p>

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
