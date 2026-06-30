"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  DEGREE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  PAGE_SIZES,
  TEACHER_STATUS_LABELS,
  WORK_TYPE_LABELS,
  useCreateTeacher,
  useDeleteTeacher,
  useTeacherList,
  useTeacherStats,
  useUpdateTeacher,
  type Teacher,
  type TeacherCategory,
  type TeacherInput,
  type TeacherWorkType,
} from "@/lib/api/hr-teachers";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/ui/date-input";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

const CATEGORY_OPTIONS: { value: TeacherCategory; label: string }[] = [
  { value: "oliy", label: "Oliy" },
  { value: "first", label: "1-toifa" },
  { value: "second", label: "2-toifa" },
  { value: "special", label: "Maxsus" },
];

const ROLE_FIELDS = [
  { key: "isSubjectTeacher", label: "Fan o'qituvchisi" },
  { key: "isAssistantTeacher", label: "Yordamchi o'qituvchi" },
  { key: "isMbr", label: "MBR" },
  { key: "isExtraLesson", label: "Qo'shimcha dars" },
  { key: "isClassLeader", label: "Sinf rahbari" },
] as const;

export default function TeachersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TeacherCategory | "">("");
  const [workType, setWorkType] = useState<TeacherWorkType | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const { data, isLoading, isError, refetch } = useTeacherList({
    page,
    limit,
    search,
    category: category || undefined,
    workType: workType || undefined,
  });
  const { data: stats } = useTeacherStats();
  const deleteTeacher = useDeleteTeacher();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTeacher.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("O'qituvchi o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="O'qituvchilar ro'yxati"
        subtitle="Maktab o'qituvchilarini boshqarish"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            O'qituvchi qo'shish
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="O'qituvchilar ro'yxati" value={stats?.total ?? 0} tone="accent" />
        <StatCard icon={<Briefcase className="h-5 w-5" />} label="To'liq" value={stats?.fullTime ?? 0} tone="positive" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Soatbay" value={stats?.hourly ?? 0} tone="caution" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Fan o'qituvchisi" value={stats?.subjectTeachers ?? 0} tone="accent" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="O'qituvchi qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          className="h-10 w-40"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as TeacherCategory | "");
            setPage(1);
          }}
          options={[{ value: "", label: "Barcha toifa" }, ...CATEGORY_OPTIONS]}
        />
        <Select
          className="h-10 w-40"
          value={workType}
          onChange={(e) => {
            setWorkType(e.target.value as TeacherWorkType | "");
            setPage(1);
          }}
          options={[
            { value: "", label: "Barcha ish turi" },
            { value: "full", label: "To'liq" },
            { value: "hourly", label: "Soatbay" },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">To'liq ismi</th>
                <th className="px-4 py-3 font-medium">Jinsi</th>
                <th className="px-4 py-3 font-medium">Tug'ilgan sana</th>
                <th className="px-4 py-3 font-medium">Toifasi</th>
                <th className="px-4 py-3 font-medium">Staji</th>
                <th className="px-4 py-3 font-medium">Ish turi</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={8}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={8}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma'lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={8}><span className="text-ink-muted">Ma'lumot yo'q</span></StateRow>
              ) : (
                rows.map((t, i) => (
                  <tr key={t.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-parchment text-ink-soft">
                          <GraduationCap className="h-4 w-4" />
                        </span>
                        {t.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.gender ? (
                        <Badge tone={t.gender === "male" ? "accent" : "caution"}>
                          {t.gender === "male" ? "Erkak" : "Ayol"}
                        </Badge>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{t.birthDate ?? "—"}</td>
                    <td className="px-4 py-3">
                      {t.category ? (
                        <div>
                          <div className="font-medium text-ink">{CATEGORY_LABELS[t.category]}</div>
                          <div className="text-xs text-ink-muted">{primaryRole(t)}</div>
                        </div>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tnum text-ink-soft">{t.experienceYears}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{WORK_TYPE_LABELS[t.workType]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(t);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O'chirish"
                          onClick={() => setDeleting(t)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-ink-muted">
            <span>Ko'rsatilmoqda</span>
            <span className="tnum text-ink">{from} - {to}</span>
            <span>dan</span>
            <span className="tnum text-ink">{total}</span>
            <span>natija</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              className="h-8 w-20 py-0"
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            />
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tnum px-2 text-ink-muted">{page} / {pageCount}</span>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(pageCount)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TeacherDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="O'qituvchini o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.fullName} o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteTeacher.isPending} onClick={confirmDelete}>O'chirish</Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

function primaryRole(t: Teacher): string {
  if (t.isSubjectTeacher) return "fan o'qituvchisi";
  if (t.isAssistantTeacher) return "yordamchi o'qituvchi";
  if (t.isClassLeader) return "sinf rahbari";
  if (t.isMbr) return "MBR";
  if (t.isExtraLesson) return "qo'shimcha dars";
  return "—";
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "accent" | "positive" | "caution";
}) {
  const tones: Record<string, string> = {
    accent: "bg-amber/15 text-amber",
    positive: "bg-emerald-500/15 text-emerald-600",
    caution: "bg-orange-500/15 text-orange-600",
  };
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div>
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="tnum text-2xl font-semibold text-ink">{value}</div>
      </div>
    </Card>
  );
}

function StateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">{children}</td>
    </tr>
  );
}

type FormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  gender: "" | "male" | "female";
  birthDate: string;
  documentNumber: string;
  pinfl: string;
  phone: string;
  workType: TeacherWorkType;
  degree: TeacherInput["degree"] | "";
  employmentType: TeacherInput["employmentType"];
  status: TeacherInput["status"];
  category: TeacherCategory | "";
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

function TeacherDrawer({
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
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

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
              onChange={(e) => set("category", e.target.value as TeacherCategory | "")}
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
