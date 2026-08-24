"use client";

import { useEffect, useRef, useState } from "react";
import { useCan } from "@/lib/auth/use-can";
import { Camera, Copy, GraduationCap, Wand2, X } from "lucide-react";
import {
  QUALIFICATION_CATEGORIES,
  QUALIFICATION_LABELS,
  QUALIFICATION_POSITION,
  useCreateStaff,
  useDepartments,
  usePositions,
  useUpdateStaff,
  type EmploymentStatus,
  type QualificationCategory,
  type StaffInput,
  type StaffMember,
} from "@/lib/api/hr";
import {
  DEGREE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  useCreateTeacher,
  useTeacherByStaff,
  useUpdateTeacher,
  type TeacherDegree,
  type TeacherEmploymentType,
  type TeacherInput,
  type TeacherWorkType,
} from "@/lib/api/hr-teachers";
import { useRoles } from "@/lib/api/roles";
import { latinToCyrillic } from "@/lib/transliterate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput, trimmedUzPhone, UZ_PHONE_PREFIX } from "@/components/ui/phone-input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { useUploadFile, ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from "@/lib/api/files";

// ─── Xodim yaratish / yangilash modal (yagona qo'shish oqimi) ──────────────
//
// Bitta forma ham oddiy xodim, ham o'qituvchi uchun: "O'qituvchilik" bo'limi
// yoqilsa, xodim yaratilgach unga Teacher yozuvi bog'lanadi. "O'qituvchi
// qo'shish" tugmasi ham shu formani ochadi (defaultTeacher bilan).

interface FormState {
  firstName: string;
  firstNameCyrillic: string;
  lastName: string;
  lastNameCyrillic: string;
  middleName: string;
  middleNameCyrillic: string;
  email: string;
  phone: string;
  photoUrl: string;
  gender: "" | "male" | "female";
  birthDate: string;
  hireDate: string;
  passportSeries: string;
  pinfl: string;
  departmentId: string;
  positionId: string;
  roleName: string;
  salary: number | null;
  status: EmploymentStatus;
  qualificationCategory: "" | QualificationCategory;
  qualificationDate: string;
  salaryChangeReason: string;
}

const EMPTY_FORM: FormState = {
  firstName: "", firstNameCyrillic: "", lastName: "", lastNameCyrillic: "",
  middleName: "", middleNameCyrillic: "", email: "", phone: UZ_PHONE_PREFIX, photoUrl: "", gender: "",
  birthDate: "", hireDate: "", passportSeries: "", pinfl: "", departmentId: "",
  positionId: "", roleName: "", salary: null, status: "active",
  qualificationCategory: "", qualificationDate: "", salaryChangeReason: "",
};

/** O'qituvchiga xos maydonlar (shaxsiy ma'lumot xodim bo'limida — takrorlanmaydi). */
interface TeacherFormState {
  workType: TeacherWorkType;
  degree: TeacherDegree | "";
  employmentType: TeacherEmploymentType;
  experienceYears: number | null;
  ratePerLesson: number | null;
  startDate: string;
  isSubjectTeacher: boolean;
  isAssistantTeacher: boolean;
  isMbr: boolean;
  isExtraLesson: boolean;
  isClassLeader: boolean;
}

const EMPTY_TEACHER_FORM: TeacherFormState = {
  workType: "full", degree: "", employmentType: "primary",
  experienceYears: null, ratePerLesson: null, startDate: "",
  isSubjectTeacher: true, isAssistantTeacher: false, isMbr: false,
  isExtraLesson: false, isClassLeader: false,
};

// "Sinf rahbari" ATAYLAB yo'q (T-05) — sabab teacher-form-drawer.tsx da.
const ROLE_FIELDS = [
  { key: "isSubjectTeacher", label: "Fan o'qituvchisi" },
  { key: "isAssistantTeacher", label: "Yordamchi o'qituvchi" },
  { key: "isMbr", label: "MBR" },
  { key: "isExtraLesson", label: "Qo'shimcha dars" },
] as const;

export function StaffFormModal({
  open,
  editing,
  defaultTeacher = false,
  onClose,
  onCreated,
  onUpdated,
}: {
  open: boolean;
  editing: StaffMember | null;
  /** true bo'lsa forma "O'qituvchilik" bo'limi yoqiq holda ochiladi (O'qituvchi qo'shish tugmasi). */
  defaultTeacher?: boolean;
  onClose: () => void;
  /** warning — xodim saqlandi, lekin o'qituvchilik yozuvida xatolik bo'lsa. */
  onCreated: (credentials: { username: string; password: string } | null, warning?: string) => void;
  onUpdated: (warning?: string) => void;
}) {
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const can = useCan();
  // Rol almashtirish — profil tahririga kirmaydigan alohida huquq (T-02).
  // Yaratishda rol — provisioning qismi, u erkin; tahrirlashda `roles.assign` kerak.
  const canAssignRole = can("roles.assign");
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const uploadPhoto = useUploadFile();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: rolesData } = useRoles({ page: 1, limit: 100 });
  // Tahrirda xodimga bog'langan o'qituvchi yozuvini yuklaymiz (bo'lmasa null).
  const { data: linkedTeacher } = useTeacherByStaff(open && editing ? editing.id : null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isTeacher, setIsTeacher] = useState(defaultTeacher);
  const [tForm, setTForm] = useState<TeacherFormState>(EMPTY_TEACHER_FORM);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
        firstNameCyrillic: editing.firstNameCyrillic ?? "",
        lastName: editing.lastName,
        lastNameCyrillic: editing.lastNameCyrillic ?? "",
        middleName: editing.middleName ?? "",
        middleNameCyrillic: editing.middleNameCyrillic ?? "",
        email: editing.email ?? "",
        phone: editing.phone ?? UZ_PHONE_PREFIX,
        photoUrl: editing.photoUrl ?? "",
        gender: editing.gender ?? "",
        birthDate: editing.birthDate ?? "",
        hireDate: editing.hireDate ?? "",
        passportSeries: editing.passportSeries ?? "",
        pinfl: editing.pinfl ?? "",
        departmentId: editing.departmentId ?? "",
        positionId: editing.positionId ?? "",
        roleName: "",
        salary: Number(editing.salary) || 0,
        status: editing.status,
        qualificationCategory: editing.qualificationCategory ?? "",
        qualificationDate: editing.qualificationDate ?? "",
        salaryChangeReason: "",
      });
      setIsTeacher(false); // bog'langan o'qituvchi yuklangach yoqiladi (quyidagi effekt)
    } else {
      setForm(EMPTY_FORM);
      setIsTeacher(defaultTeacher);
      setTForm(EMPTY_TEACHER_FORM);
    }
    setError(null);
  }, [open, editing, defaultTeacher]);

  // Tahrirda xodim o'qituvchi bo'lsa — bo'limni yoqib, maydonlarni to'ldiramiz.
  useEffect(() => {
    if (!open || !editing) return;
    if (linkedTeacher) {
      setIsTeacher(true);
      setTForm({
        workType: linkedTeacher.workType,
        degree: linkedTeacher.degree ?? "",
        employmentType: linkedTeacher.employmentType,
        experienceYears: linkedTeacher.experienceYears,
        ratePerLesson: Number(linkedTeacher.ratePerLesson) || 0,
        startDate: linkedTeacher.startDate ?? "",
        isSubjectTeacher: linkedTeacher.isSubjectTeacher,
        isAssistantTeacher: linkedTeacher.isAssistantTeacher,
        isMbr: linkedTeacher.isMbr,
        isExtraLesson: linkedTeacher.isExtraLesson,
        isClassLeader: linkedTeacher.isClassLeader,
      });
    }
  }, [open, editing, linkedTeacher]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setT<K extends keyof TeacherFormState>(key: K, value: TeacherFormState[K]) {
    setTForm((f) => ({ ...f, [key]: value }));
  }

  const deptOptions = [{ value: "", label: "Bo'limni tanlang" }, ...(departments ?? []).map((d) => ({ value: d.id, label: d.name }))];
  const posOptions = [{ value: "", label: "Lavozimni tanlang" }, ...(positions ?? []).map((p) => ({ value: p.id, label: p.title }))];
  const roleOptions = [{ value: "", label: "Rolsiz" }, ...(rolesData?.items ?? []).map((r) => ({ value: r.name, label: r.name }))];

  /** O'qituvchi yozuvi uchun payload — shaxsiy maydonlar DTO talabi uchun beriladi, backend ularni xodimdan oladi. */
  function teacherPayload(): TeacherInput {
    return {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      workType: tForm.workType,
      degree: tForm.degree || undefined,
      employmentType: tForm.employmentType,
      experienceYears: tForm.experienceYears ?? undefined,
      ratePerLesson: tForm.ratePerLesson ?? undefined,
      startDate: tForm.startDate || form.hireDate || undefined,
      isSubjectTeacher: tForm.isSubjectTeacher,
      isAssistantTeacher: tForm.isAssistantTeacher,
      isMbr: tForm.isMbr,
      isExtraLesson: tForm.isExtraLesson,
      isClassLeader: tForm.isClassLeader,
    };
  }

  async function submit() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Ism va familiyani kiriting");
      return;
    }
    if (!form.email.trim()) {
      setError("Email kiriting");
      return;
    }
    if (!form.gender) {
      setError("Jinsni tanlang");
      return;
    }
    if (!form.hireDate) {
      setError("Ishga qabul sanasini kiriting");
      return;
    }
    if (!form.departmentId) {
      setError("Bo'limni tanlang");
      return;
    }
    if (!form.positionId) {
      setError("Lavozimni tanlang");
      return;
    }

    const payload: StaffInput = {
      firstName: form.firstName.trim(),
      firstNameCyrillic: form.firstNameCyrillic.trim() || undefined,
      lastName: form.lastName.trim(),
      lastNameCyrillic: form.lastNameCyrillic.trim() || undefined,
      middleName: form.middleName.trim() || undefined,
      middleNameCyrillic: form.middleNameCyrillic.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: trimmedUzPhone(form.phone),
      photoUrl: form.photoUrl.trim() || undefined,
      gender: form.gender || undefined,
      birthDate: form.birthDate || undefined,
      hireDate: form.hireDate,
      passportSeries: form.passportSeries.trim() || undefined,
      pinfl: form.pinfl.trim() || undefined,
      departmentId: form.departmentId,
      positionId: form.positionId,
      roleName: editing && !canAssignRole ? undefined : form.roleName || undefined,
      salary: form.salary ?? 0,
      status: form.status,
      qualificationCategory: form.qualificationCategory || undefined,
      qualificationDate: form.qualificationDate || undefined,
      salaryChangeReason: form.salaryChangeReason.trim() || undefined,
    };

    const teacherWarning =
      "Xodim saqlandi, lekin o'qituvchilik ma'lumotlarini saqlashda xatolik — keyinroq qayta urinib ko'ring";

    try {
      if (editing) {
        await updateStaff.mutateAsync({ id: editing.id, input: payload });
        // O'qituvchilik bo'limi: mavjud yozuvni yangilaymiz yoki yangi bog'laymiz.
        if (isTeacher) {
          try {
            if (linkedTeacher) {
              await updateTeacher.mutateAsync({ id: linkedTeacher.id, input: teacherPayload() });
            } else {
              await createTeacher.mutateAsync({ ...teacherPayload(), staffMemberId: editing.id });
            }
          } catch {
            onUpdated(teacherWarning);
            return;
          }
        }
        onUpdated();
      } else {
        const res = await createStaff.mutateAsync(payload);
        if (isTeacher) {
          try {
            await createTeacher.mutateAsync({ ...teacherPayload(), staffMemberId: res.staff.id });
          } catch {
            onCreated(res.credentials, teacherWarning);
            return;
          }
        }
        onCreated(res.credentials);
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending =
    createStaff.isPending || updateStaff.isPending || createTeacher.isPending || updateTeacher.isPending;
  // Mavjud o'qituvchilik yozuvini bu formada uzib bo'lmaydi — rolni olib
  // tashlash O'qituvchilar sahifasidagi aniq amal orqali bajariladi.
  const teacherLocked = !!linkedTeacher;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Xodimni yangilash" : "Xodim yaratish"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            {editing ? "Yangilash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-2 sm:col-span-2">
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

        <TranslitPair
          label="Ism (lotin)" required latinValue={form.firstName}
          cyrLabel="Ism (kirill)" cyrValue={form.firstNameCyrillic}
          onLatin={(v) => set("firstName", v)} onCyr={(v) => set("firstNameCyrillic", v)}
        />
        <TranslitPair
          label="Familiya (lotin)" required latinValue={form.lastName}
          cyrLabel="Familiya (kirill)" cyrValue={form.lastNameCyrillic}
          onLatin={(v) => set("lastName", v)} onCyr={(v) => set("lastNameCyrillic", v)}
        />
        <TranslitPair
          label="Otasining ismi (lotin)" latinValue={form.middleName}
          cyrLabel="Otasining ismi (kirill)" cyrValue={form.middleNameCyrillic}
          onLatin={(v) => set("middleName", v)} onCyr={(v) => set("middleNameCyrillic", v)}
        />

        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" />
        </Field>
        <Field label="Telefon">
          <PhoneInput value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>

        <Field label="Jins" required>
          <Select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value as FormState["gender"])}
            options={[{ value: "", label: "Jinsni tanlang" }, { value: "male", label: "Erkak" }, { value: "female", label: "Ayol" }]}
          />
        </Field>
        <Field label="Tug'ilgan sana">
          <DatePicker value={form.birthDate} onChange={(iso) => set("birthDate", iso)} />
        </Field>

        <Field label="Ishga qabul sanasi" required>
          <DatePicker value={form.hireDate} onChange={(iso) => set("hireDate", iso)} />
        </Field>
        <Field label="Pasport seriyasi">
          <Input value={form.passportSeries} onChange={(e) => set("passportSeries", e.target.value)} placeholder="AB1234567" />
        </Field>

        <Field label="PINFL">
          <Input value={form.pinfl} onChange={(e) => set("pinfl", e.target.value)} placeholder="14 raqam" />
        </Field>
        <Field label="Bo'lim" required>
          <Select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)} options={deptOptions} />
        </Field>

        <Field label="Lavozim" required>
          <Select value={form.positionId} onChange={(e) => set("positionId", e.target.value)} options={posOptions} />
        </Field>
        <Field label="Maosh">
          <NumberInput value={form.salary} onChange={(v) => set("salary", v)} placeholder="0" />
        </Field>

        <Field label="Rol (login uchun)">
          <Select
            value={form.roleName}
            onChange={(e) => set("roleName", e.target.value)}
            options={roleOptions}
            disabled={Boolean(editing) && !canAssignRole}
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value as EmploymentStatus)}
            options={[{ value: "active", label: "Faol" }, { value: "dismissed", label: "Faol emas" }, { value: "on_leave", label: "Ta'tilda" }]}
          />
        </Field>

        <Field label="Malaka toifasi (o'qituvchi uchun)">
          <Select
            value={form.qualificationCategory}
            onChange={(e) => {
              const value = e.target.value as "" | QualificationCategory;
              set("qualificationCategory", value);
              // Toifaga mos lavozimni avtomatik taklif qilamiz (agar topilsa).
              if (value) {
                const match = (positions ?? []).find((p) => p.title === QUALIFICATION_POSITION[value]);
                if (match) set("positionId", match.id);
              }
            }}
            options={[
              { value: "", label: "Toifasiz" },
              ...QUALIFICATION_CATEGORIES.map((c) => ({ value: c, label: QUALIFICATION_LABELS[c] })),
            ]}
          />
        </Field>
        <Field label="Toifa berilgan sana">
          <DatePicker value={form.qualificationDate} onChange={(iso) => set("qualificationDate", iso)} />
        </Field>

        {editing && (
          <div className="sm:col-span-2">
            <Field label="Maosh o'zgarishi sababi (ixtiyoriy)">
              <Input
                value={form.salaryChangeReason}
                onChange={(e) => set("salaryChangeReason", e.target.value)}
                placeholder="Maosh o'zgartirilsa, sababini yozing"
              />
            </Field>
          </div>
        )}

        {/* ─── O'qituvchilik bo'limi ─────────────────────────────────────── */}
        <div className="sm:col-span-2">
          <label
            className={`flex items-center gap-3 rounded-xl border border-line bg-parchment/40 px-4 py-3 ${
              teacherLocked ? "" : "cursor-pointer"
            }`}
          >
            <Switch
              checked={isTeacher}
              onCheckedChange={(v) => {
                if (!teacherLocked) setIsTeacher(v);
              }}
              disabled={teacherLocked}
              aria-label="Bu xodim o'qituvchi"
            />
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber/15 text-amber">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-medium text-ink">Bu xodim o'qituvchi</span>
              <span className="block text-xs text-ink-muted">
                {teacherLocked
                  ? "O'qituvchilik rolini olib tashlash O'qituvchilar sahifasidan bajariladi"
                  : "Yoqilsa, xodimga o'qituvchilik yozuvi bog'lanadi"}
              </span>
            </span>
          </label>
        </div>

        {isTeacher && (
          <>
            <Field label="Ish turi">
              <Select
                value={tForm.workType}
                onChange={(e) => setT("workType", e.target.value as TeacherWorkType)}
                options={[{ value: "full", label: "To'liq" }, { value: "hourly", label: "Soatbay" }]}
              />
            </Field>
            <Field label="Daraja">
              <Select
                value={tForm.degree}
                onChange={(e) => setT("degree", (e.target.value || "") as TeacherFormState["degree"])}
                options={[
                  { value: "", label: "Tanlang" },
                  ...Object.entries(DEGREE_LABELS).map(([value, label]) => ({ value, label })),
                ]}
              />
            </Field>
            <Field label="Ishlash turi">
              <Select
                value={tForm.employmentType}
                onChange={(e) => setT("employmentType", e.target.value as TeacherEmploymentType)}
                options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <Field label="Tajriba (yil)">
              <NumberInput value={tForm.experienceYears} onChange={(v) => setT("experienceYears", v)} placeholder="0" />
            </Field>
            <Field label="Dars uchun stavka">
              <NumberInput value={tForm.ratePerLesson} onChange={(v) => setT("ratePerLesson", v)} placeholder="0" />
            </Field>
            <Field label="Dars berish boshlangan sana">
              <DatePicker value={tForm.startDate} onChange={(iso) => setT("startDate", iso)} />
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-1.5 text-sm font-medium text-ink">Pedagogik rollar</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ROLE_FIELDS.map((r) => (
                  <label
                    key={r.key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5"
                  >
                    <Switch checked={tForm[r.key]} onCheckedChange={(v) => setT(r.key, v)} aria-label={r.label} />
                    <span className="text-sm text-ink">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {error && <div className="mt-3 text-sm text-negative">{error}</div>}
    </Modal>
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

/** Lotin + kirill juftligi; kirill yonida transliteratsiya tugmasi. */
function TranslitPair({
  label, cyrLabel, required, latinValue, cyrValue, onLatin, onCyr,
}: {
  label: string;
  cyrLabel: string;
  required?: boolean;
  latinValue: string;
  cyrValue: string;
  onLatin: (v: string) => void;
  onCyr: (v: string) => void;
}) {
  return (
    <>
      <Field label={label} required={required}>
        <Input value={latinValue} onChange={(e) => onLatin(e.target.value)} />
      </Field>
      <Field label={cyrLabel}>
        <div className="flex gap-1.5">
          <Input value={cyrValue} onChange={(e) => onCyr(e.target.value)} />
          <button
            type="button"
            title="Lotindan kirillga o'girish"
            onClick={() => onCyr(latinToCyrillic(latinValue))}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-soft hover:border-amber hover:text-amber"
          >
            <Wand2 className="h-4 w-4" />
          </button>
        </div>
      </Field>
    </>
  );
}

// ─── Login ma'lumotlari modal (yaratishdan keyin bir marta) ────────────────

export function CredentialsModal({
  credentials,
  onClose,
}: {
  credentials: { username: string; password: string } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!credentials) return;
    navigator.clipboard
      ?.writeText(`Login: ${credentials.username}\nParol: ${credentials.password}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  }

  return (
    <Modal
      open={!!credentials}
      onClose={onClose}
      title="Login ma'lumotlari"
      subtitle="Bu parol faqat hozir ko'rsatiladi — saqlab oling"
      footer={
        <div className="flex justify-end">
          <Button variant="accent" onClick={onClose}>Tushunarli</Button>
        </div>
      }
    >
      {credentials && (
        <div className="space-y-3">
          <CredRow label="Login" value={credentials.username} />
          <CredRow label="Parol" value={credentials.password} />
          <Button variant="secondary" size="sm" onClick={copy}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {copied ? "Nusxalandi" : "Nusxalash"}
          </Button>
        </div>
      )}
    </Modal>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-parchment/40 px-3 py-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="font-mono text-sm text-ink">{value}</span>
    </div>
  );
}
