"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Eye,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_TONE,
  PAGE_SIZES,
  QUALIFICATION_CATEGORIES,
  QUALIFICATION_LABELS,
  QUALIFICATION_POSITION,
  useCreateStaff,
  useDeleteStaff,
  useDepartments,
  usePositions,
  useSalaryHistory,
  useStaff,
  useUpdateStaff,
  type EmploymentStatus,
  type QualificationCategory,
  type StaffInput,
  type StaffMember,
} from "@/lib/api/hr";
import { useRoles } from "@/lib/api/roles";
import { latinToCyrillic } from "@/lib/transliterate";
import { formatDateDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";

const STATUS_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "active", label: "Faol" },
  { value: "dismissed", label: "Faol emas" },
  { value: "on_leave", label: "Ta'tilda" },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | EmploymentStatus>("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [historyFor, setHistoryFor] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
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

  const { data, isLoading, isError, refetch } = useStaff({
    page,
    limit,
    search,
    status: status || undefined,
    departmentId: departmentId || undefined,
    positionId: positionId || undefined,
  });
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const deleteStaff = useDeleteStaff();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const deptOptions = useMemo(
    () => [{ value: "", label: "Barchasi" }, ...(departments ?? []).map((d) => ({ value: d.id, label: d.name }))],
    [departments],
  );
  const posOptions = useMemo(
    () => [{ value: "", label: "Barchasi" }, ...(positions ?? []).map((p) => ({ value: p.id, label: p.title }))],
    [positions],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(s: StaffMember) {
    setEditing(s);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteStaff.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Xodim o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Xodimlar"
        action={
          <Button variant="accent" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Xodim qo‘shish
          </Button>
        }
      />

      {/* Filtrlar */}
      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Xodimlarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | EmploymentStatus);
            setPage(1);
          }}
        />
        <Select
          options={deptOptions}
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={posOptions}
          value={positionId}
          onChange={(e) => {
            setPositionId(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">To‘liq ism</th>
                <th className="px-4 py-3 font-medium">Bo‘lim</th>
                <th className="px-4 py-3 font-medium">Lavozim</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Ishga qabul sanasi</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={9}>
                  <Spinner className="mx-auto h-5 w-5" />
                </StateRow>
              ) : isError ? (
                <StateRow colSpan={9}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={9}>
                  <span className="text-ink-muted">Ma‘lumot yo‘q</span>
                </StateRow>
              ) : (
                rows.map((s, i) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-parchment/40"
                    onClick={() => router.push(`/hr/employees/${s.id}`)}
                  >
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {`${s.lastName} ${s.firstName}${s.middleName ? " " + s.middleName : ""}`}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{s.department?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.position?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.email ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.hireDate ? formatDateDMY(s.hireDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={EMPLOYMENT_STATUS_TONE[s.status]}>
                        {EMPLOYMENT_STATUS_LABELS[s.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Batafsil"
                          onClick={() => router.push(`/hr/employees/${s.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Maosh tarixi"
                          onClick={() => setHistoryFor(s)}
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O‘chirish"
                          onClick={() => setDeleting(s)}
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
            <span>Ko‘rsatilmoqda</span>
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

      <StaffFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onCreated={(creds) => {
          setFormOpen(false);
          setToast("Xodim muvaffaqiyatli yaratildi");
          if (creds) setCredentials(creds);
        }}
        onUpdated={() => {
          setFormOpen(false);
          setToast("Xodim ma‘lumotlari yangilandi");
        }}
      />

      <SalaryHistoryModal staff={historyFor} onClose={() => setHistoryFor(null)} />

      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Xodimni o‘chirish">
        <p className="text-sm text-ink-muted">
          {deleting && `${deleting.lastName} ${deleting.firstName}`} o‘chiriladi. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteStaff.isPending} onClick={confirmDelete}>O‘chirish</Button>
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

function StateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        {children}
      </td>
    </tr>
  );
}

// ─── Xodim yaratish / yangilash modal ──────────────────────────────────────

interface FormState {
  firstName: string;
  firstNameCyrillic: string;
  lastName: string;
  lastNameCyrillic: string;
  middleName: string;
  middleNameCyrillic: string;
  email: string;
  phone: string;
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
  middleName: "", middleNameCyrillic: "", email: "", phone: "", gender: "",
  birthDate: "", hireDate: "", passportSeries: "", pinfl: "", departmentId: "",
  positionId: "", roleName: "", salary: null, status: "active",
  qualificationCategory: "", qualificationDate: "", salaryChangeReason: "",
};

function StaffFormModal({
  open,
  editing,
  onClose,
  onCreated,
  onUpdated,
}: {
  open: boolean;
  editing: StaffMember | null;
  onClose: () => void;
  onCreated: (credentials: { username: string; password: string } | null) => void;
  onUpdated: () => void;
}) {
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: rolesData } = useRoles({ page: 1, limit: 100 });
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

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
        phone: editing.phone ?? "",
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
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const deptOptions = [{ value: "", label: "Bo‘limni tanlang" }, ...(departments ?? []).map((d) => ({ value: d.id, label: d.name }))];
  const posOptions = [{ value: "", label: "Lavozimni tanlang" }, ...(positions ?? []).map((p) => ({ value: p.id, label: p.title }))];
  const roleOptions = [{ value: "", label: "Rolsiz" }, ...(rolesData?.items ?? []).map((r) => ({ value: r.name, label: r.name }))];

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
      setError("Bo‘limni tanlang");
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
      phone: form.phone.trim() || undefined,
      gender: form.gender || undefined,
      birthDate: form.birthDate || undefined,
      hireDate: form.hireDate,
      passportSeries: form.passportSeries.trim() || undefined,
      pinfl: form.pinfl.trim() || undefined,
      departmentId: form.departmentId,
      positionId: form.positionId,
      roleName: form.roleName || undefined,
      salary: form.salary ?? 0,
      status: form.status,
      qualificationCategory: form.qualificationCategory || undefined,
      qualificationDate: form.qualificationDate || undefined,
      salaryChangeReason: form.salaryChangeReason.trim() || undefined,
    };

    try {
      if (editing) {
        await updateStaff.mutateAsync({ id: editing.id, input: payload });
        onUpdated();
      } else {
        const res = await createStaff.mutateAsync(payload);
        onCreated(res.credentials);
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createStaff.isPending || updateStaff.isPending;

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
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998..." />
        </Field>

        <Field label="Jins" required>
          <Select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value as FormState["gender"])}
            options={[{ value: "", label: "Jinsni tanlang" }, { value: "male", label: "Erkak" }, { value: "female", label: "Ayol" }]}
          />
        </Field>
        <Field label="Tug‘ilgan sana">
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
        <Field label="Bo‘lim" required>
          <Select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)} options={deptOptions} />
        </Field>

        <Field label="Lavozim" required>
          <Select value={form.positionId} onChange={(e) => set("positionId", e.target.value)} options={posOptions} />
        </Field>
        <Field label="Maosh">
          <NumberInput value={form.salary} onChange={(v) => set("salary", v)} placeholder="0" />
        </Field>

        <Field label="Rol (login uchun)">
          <Select value={form.roleName} onChange={(e) => set("roleName", e.target.value)} options={roleOptions} />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value as EmploymentStatus)}
            options={[{ value: "active", label: "Faol" }, { value: "dismissed", label: "Faol emas" }, { value: "on_leave", label: "Ta'tilda" }]}
          />
        </Field>

        <Field label="Malaka toifasi (o‘qituvchi uchun)">
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
            <Field label="Maosh o‘zgarishi sababi (ixtiyoriy)">
              <Input
                value={form.salaryChangeReason}
                onChange={(e) => set("salaryChangeReason", e.target.value)}
                placeholder="Maosh o‘zgartirilsa, sababini yozing"
              />
            </Field>
          </div>
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
            title="Lotindan kirillga o‘girish"
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

// ─── Maosh tarixi modal ────────────────────────────────────────────────────

function SalaryHistoryModal({ staff, onClose }: { staff: StaffMember | null; onClose: () => void }) {
  const { data, isLoading } = useSalaryHistory(staff?.id ?? null);
  const rows = data ?? [];

  return (
    <Modal
      open={!!staff}
      onClose={onClose}
      title="Maosh tarixi"
      subtitle={staff ? `${staff.lastName} ${staff.firstName}` : undefined}
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Yopish</Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-2 font-medium">№</th>
              <th className="px-3 py-2 font-medium">O‘zgartirilgan sana</th>
              <th className="px-3 py-2 text-right font-medium">Eski maosh</th>
              <th className="px-3 py-2 text-right font-medium">Yangi maosh</th>
              <th className="px-3 py-2 font-medium">Sabab</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center"><Spinner className="mx-auto h-5 w-5" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-ink-muted">Maosh tarixi bo‘sh</td></tr>
            ) : (
              rows.map((h, i) => (
                <tr key={h.id} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                  <td className="px-3 py-2 text-ink-soft">{formatDateDMY(h.createdAt)}</td>
                  <td className="tnum px-3 py-2 text-right text-ink-soft">{h.oldSalary != null ? formatMoney(h.oldSalary) : "—"}</td>
                  <td className="tnum px-3 py-2 text-right font-medium text-ink">{formatMoney(h.newSalary)}</td>
                  <td className="px-3 py-2 text-ink-soft">{h.reason ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── Login ma'lumotlari modal (yaratishdan keyin bir marta) ────────────────

function CredentialsModal({
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
      title="Login ma‘lumotlari"
      subtitle="Bu parol faqat hozir ko‘rsatiladi — saqlab oling"
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
