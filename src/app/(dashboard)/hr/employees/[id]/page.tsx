"use client";

import { Suspense, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarClock,
  Crown,
  Medal,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Trophy,
  UserX,
} from "lucide-react";
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_TONE,
  GENDER_LABELS,
  QUALIFICATION_LABELS,
  useSalaryHistory,
  useStaffMember,
  useUpdateStaff,
  type StaffMember,
} from "@/lib/api/hr";
import {
  ATTENDANCE_ACTION_LABELS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_TONE,
  useAttendance,
} from "@/lib/api/hr-attendance";
import {
  STAFF_ACHIEVEMENT_CATEGORY_LABELS,
  STAFF_ACHIEVEMENT_RANK_LABELS,
  useCreateStaffAchievement,
  useCreateStaffCertificate,
  useDeleteStaffAchievement,
  useDeleteStaffCertificate,
  useStaffAchievements,
  useStaffCertificates,
  useUpdateStaffAchievement,
  useUpdateStaffCertificate,
  type StaffAchievement,
  type StaffAchievementCategory,
  type StaffAchievementIcon,
  type StaffAchievementInput,
  type StaffAchievementRank,
  type StaffCertificate,
  type StaffCertificateInput,
} from "@/lib/api/hr-staff-portfolio";
import {
  DEGREE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  TEACHER_STATUS_LABELS,
  TEACHER_STATUS_TONE,
  WORK_TYPE_LABELS,
  useDeleteTeacher,
  useTeacherByStaff,
  type Teacher,
} from "@/lib/api/hr-teachers";
import { TeacherDrawer } from "@/components/hr/teacher-form-drawer";
import { StaffFinanceTab } from "@/components/hr/staff-finance-tab";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateDMY, formatDateTimeDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";

// Yagona xodim profili: "O'qituvchilik" tabi faqat bog'langan Teacher yozuvi
// bo'lsa ko'rinadi (?tab=teaching bilan chuqur havola qilinadi).
const BASE_TABS = [
  { key: "overview", label: "Ma'lumotlar" },
  { key: "teaching", label: "O'qituvchilik" },
  { key: "finance", label: "Moliya" },
  { key: "salary", label: "Maosh tarixi" },
  { key: "attendance", label: "Davomat" },
  { key: "certificates", label: "Sertifikatlar" },
  { key: "achievements", label: "Yutuqlar" },
] as const;

type TabKey = (typeof BASE_TABS)[number]["key"];

function isTabKey(v: string | null): v is TabKey {
  return !!v && BASE_TABS.some((t) => t.key === v);
}

// useSearchParams (?tab=) Suspense chegarasini talab qiladi.
export default function EmployeeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-24">
          <Spinner className="h-7 w-7" />
        </div>
      }
    >
      <EmployeeDetail />
    </Suspense>
  );
}

function EmployeeDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const requested = searchParams.get("tab");
  const [tab, setTab] = useState<TabKey>(isTabKey(requested) ? requested : "overview");
  const [dismissOpen, setDismissOpen] = useState(false);

  const { data: staff, isLoading } = useStaffMember(id);
  const { data: teacher } = useTeacherByStaff(id);
  const updateStaff = useUpdateStaff();

  async function confirmDismiss() {
    // Ishdan bo'shatish = status o'zgarishi (yozuv o'chirilmaydi — tarix saqlanadi).
    await updateStaff.mutateAsync({ id, input: { status: "dismissed" } });
    setDismissOpen(false);
  }

  // O'qituvchi bo'lmagan xodimda "O'qituvchilik" tabi ko'rsatilmaydi; teacher
  // hali yuklanmagan bo'lsa ham tab ro'yxatda turmaydi, yuklangach paydo bo'ladi.
  const tabs = BASE_TABS.filter((t) => t.key !== "teaching" || !!teacher);
  const activeTab: TabKey = tab === "teaching" && !teacher ? "overview" : tab;

  function selectTab(key: TabKey) {
    setTab(key);
    router.replace(`/hr/employees/${id}?tab=${key}`, { scroll: false });
  }

  if (isLoading || !staff) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const fullName = `${staff.lastName} ${staff.firstName}${staff.middleName ? " " + staff.middleName : ""}`;

  return (
    <div className="stagger">
      <button
        onClick={() => router.push("/hr/employees")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Xodimlar ro‘yxati
      </button>

      {/* Header */}
      <div className="card mb-5 flex flex-wrap items-center gap-4 p-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/12 text-lg font-semibold text-accent">
          {(staff.lastName[0] ?? "") + (staff.firstName[0] ?? "")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-ink">{fullName}</h1>
            <Badge tone={EMPLOYMENT_STATUS_TONE[staff.status]}>{EMPLOYMENT_STATUS_LABELS[staff.status]}</Badge>
            {staff.qualificationCategory && (
              <Badge tone="accent">{QUALIFICATION_LABELS[staff.qualificationCategory]}</Badge>
            )}
          </div>
          <p className="mt-1 font-mono text-sm text-ink-muted">{staff.employeeCode}</p>
        </div>
        <div className="text-right text-sm text-ink-muted">
          <p>{staff.position?.title ?? "—"}</p>
          <p>{staff.department?.name ?? "—"}</p>
        </div>
        {staff.status !== "dismissed" && (
          <Button variant="secondary" size="sm" onClick={() => setDismissOpen(true)}>
            <UserX className="h-4 w-4 text-negative" /> Ishdan bo‘shatish
          </Button>
        )}
      </div>

      <Modal open={dismissOpen} onClose={() => setDismissOpen(false)} title="Ishdan bo‘shatish">
        <p className="text-sm text-ink-muted">
          {fullName} <span className="font-medium text-ink">“Faol emas”</span> holatiga o‘tkaziladi — barcha
          yozuvlari (maosh tarixi, davomat, hujjatlar) saqlanib qoladi. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDismissOpen(false)}>Bekor qilish</Button>
          <Button variant="danger" loading={updateStaff.isPending} onClick={confirmDismiss}>
            Ishdan bo‘shatish
          </Button>
        </div>
      </Modal>

      {/* Tab nav */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab staff={staff} />}
      {activeTab === "teaching" && teacher && <TeacherInfoCard teacher={teacher} />}
      {activeTab === "finance" && <StaffFinanceTab staff={staff} />}
      {activeTab === "salary" && <SalaryTab staffId={id} />}
      {activeTab === "attendance" && <AttendanceTab staffId={id} />}
      {activeTab === "certificates" && <CertificatesTab staffId={id} />}
      {activeTab === "achievements" && <AchievementsTab staffId={id} />}
    </div>
  );
}

// ─── Ma'lumotlar tab ──────────────────────────────────────────────────────────

function OverviewTab({ staff }: { staff: StaffMember }) {
  const rows: { label: string; value: string }[] = [
    { label: "Bo‘lim", value: staff.department?.name ?? "—" },
    { label: "Lavozim", value: staff.position?.title ?? "—" },
    { label: "Malaka toifasi", value: staff.qualificationCategory ? QUALIFICATION_LABELS[staff.qualificationCategory] : "—" },
    { label: "Toifa berilgan sana", value: staff.qualificationDate ? formatDateDMY(staff.qualificationDate) : "—" },
    { label: "Email", value: staff.email ?? "—" },
    { label: "Telefon", value: staff.phone ?? "—" },
    { label: "Jins", value: staff.gender ? GENDER_LABELS[staff.gender] : "—" },
    { label: "Tug‘ilgan sana", value: staff.birthDate ? formatDateDMY(staff.birthDate) : "—" },
    { label: "Ishga qabul sanasi", value: staff.hireDate ? formatDateDMY(staff.hireDate) : "—" },
    { label: "Maosh", value: staff.salary ? formatMoney(staff.salary) : "—" },
    { label: "Pasport seriyasi", value: staff.passportSeries ?? "—" },
    { label: "PINFL", value: staff.pinfl ?? "—" },
  ];

  return (
    <Card className="p-5">
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">{r.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// ─── O'qituvchi ma'lumotlari (xodim o'qituvchi bo'lsa) ────────────────────────

function TeacherInfoCard({ teacher }: { teacher: Teacher }) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const deleteTeacher = useDeleteTeacher();

  async function confirmRemoveRole() {
    // Faqat o'qituvchilik yozuvi o'chadi — xodim saqlanadi (tab o'zi yo'qoladi).
    await deleteTeacher.mutateAsync(teacher.id);
    setRemoveOpen(false);
  }
  const rows: { label: string; value: string }[] = [
    { label: "Ish turi", value: WORK_TYPE_LABELS[teacher.workType] },
    { label: "Daraja", value: teacher.degree ? DEGREE_LABELS[teacher.degree] : "—" },
    { label: "Ishlash turi", value: EMPLOYMENT_TYPE_LABELS[teacher.employmentType] },
    { label: "Tajriba (yil)", value: String(teacher.experienceYears ?? 0) },
    { label: "Dars uchun stavka", value: teacher.ratePerLesson ? formatMoney(teacher.ratePerLesson) : "—" },
    { label: "Ish boshlagan sana", value: teacher.startDate ? formatDateDMY(teacher.startDate) : "—" },
    { label: "Ish tugagan sana", value: teacher.endDate ? formatDateDMY(teacher.endDate) : "—" },
  ];

  const roles: { label: string; on: boolean }[] = [
    { label: "Fan o'qituvchisi", on: teacher.isSubjectTeacher },
    { label: "Yordamchi o'qituvchi", on: teacher.isAssistantTeacher },
    { label: "MBR", on: teacher.isMbr },
    { label: "Qo'shimcha dars", on: teacher.isExtraLesson },
    { label: "Sinf rahbari", on: teacher.isClassLeader },
  ];
  const activeRoles = roles.filter((r) => r.on);

  return (
    <>
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-base font-semibold text-ink">O'qituvchi ma'lumotlari</h2>
        <Badge tone={TEACHER_STATUS_TONE[teacher.status]}>{TEACHER_STATUS_LABELS[teacher.status]}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Tahrirlash
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setRemoveOpen(true)}>
            <Trash2 className="h-4 w-4 text-negative" /> Rolni olib tashlash
          </Button>
        </div>
      </div>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">{r.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <dt className="mb-1.5 text-xs uppercase tracking-wide text-ink-muted">Rollar</dt>
        {activeRoles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeRoles.map((r) => (
              <Badge key={r.label} tone="accent">{r.label}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-ink-muted">—</span>
        )}
      </div>
      {teacher.note && (
        <div className="mt-4">
          <dt className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Izoh</dt>
          <dd className="text-sm text-ink">{teacher.note}</dd>
        </div>
      )}
    </Card>

    <TeacherDrawer
      open={editOpen}
      editing={teacher}
      onClose={() => setEditOpen(false)}
      onSaved={() => {
        setEditOpen(false);
        // O'qituvchi shaxsiy maydonlari (ism, rasm) xodimga saqlanadi — xodim
        // kartochkasi sarlavhasi ham yangilanishi uchun staff so'rovini yangilaymiz.
        qc.invalidateQueries({ queryKey: ["hr", "staff"] });
      }}
    />

    <Modal open={removeOpen} onClose={() => setRemoveOpen(false)} title="O'qituvchilik rolini olib tashlash">
      <p className="text-sm text-ink-muted">
        {teacher.fullName} dan o'qituvchilik roli olib tashlanadi — u{" "}
        <span className="font-medium text-ink">xodim sifatida ishlashda davom etadi</span>. Ishdan bo'shatish
        yuqoridagi alohida amal orqali bajariladi. Davom etilsinmi?
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setRemoveOpen(false)}>Bekor qilish</Button>
        <Button variant="danger" loading={deleteTeacher.isPending} onClick={confirmRemoveRole}>
          Rolni olib tashlash
        </Button>
      </div>
    </Modal>
    </>
  );
}

// ─── Maosh tarixi tab ─────────────────────────────────────────────────────────

function SalaryTab({ staffId }: { staffId: string }) {
  const { data, isLoading } = useSalaryHistory(staffId);
  const rows = data ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-3 font-medium">№</th>
            <th className="px-4 py-3 font-medium">O‘zgartirilgan sana</th>
            <th className="px-4 py-3 text-right font-medium">Eski maosh</th>
            <th className="px-4 py-3 text-right font-medium">Yangi maosh</th>
            <th className="px-4 py-3 font-medium">Sabab</th>
            <th className="px-4 py-3 font-medium">Kim o‘zgartirgan</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center"><Spinner className="mx-auto h-5 w-5" /></td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">Maosh tarixi bo‘sh</td></tr>
          ) : (
            rows.map((h, i) => (
              <tr key={h.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 text-ink-muted">{i + 1}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDateDMY(h.createdAt)}</td>
                <td className="tnum px-4 py-3 text-right text-ink-soft">{h.oldSalary != null ? formatMoney(h.oldSalary) : "—"}</td>
                <td className="tnum px-4 py-3 text-right font-medium text-ink">{formatMoney(h.newSalary)}</td>
                <td className="px-4 py-3 text-ink-soft">{h.reason ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{h.changedByName ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Davomat tab ──────────────────────────────────────────────────────────────

function AttendanceTab({ staffId }: { staffId: string }) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useAttendance({ staffMemberId: staffId, page, limit });
  const rows = data?.items ?? [];
  const pageCount = data?.meta?.pageCount ?? 1;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-3 font-medium">№</th>
            <th className="px-4 py-3 font-medium">Vaqt</th>
            <th className="px-4 py-3 font-medium">Amal</th>
            <th className="px-4 py-3 font-medium">Hudud</th>
            <th className="px-4 py-3 font-medium">Holat</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="px-4 py-12 text-center"><Spinner className="mx-auto h-5 w-5" /></td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted">Davomat yozuvlari yo‘q</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                <td className="tnum px-4 py-3 text-ink">{formatDateTimeDMY(r.recordedAt)}</td>
                <td className="px-4 py-3 text-ink-soft">{ATTENDANCE_ACTION_LABELS[r.action]}</td>
                <td className="px-4 py-3 text-ink-soft">{r.geofenceName ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={ATTENDANCE_STATUS_TONE[r.status]}>{ATTENDANCE_STATUS_LABELS[r.status]}</Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3 text-sm">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Oldingi
          </Button>
          <span className="tnum px-1 text-ink-muted">{page} / {pageCount}</span>
          <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
            Keyingi
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Sertifikatlar tab ────────────────────────────────────────────────────────

/** Muddat holati: o'tgan (negative), yaqin 30 kun (caution), amalda (neutral). */
function expiryTone(expiresAt: string | null): "neutral" | "caution" | "negative" {
  if (!expiresAt) return "neutral";
  const now = new Date();
  const exp = new Date(expiresAt);
  const days = (exp.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "negative";
  if (days <= 30) return "caution";
  return "neutral";
}

function CertificatesTab({ staffId }: { staffId: string }) {
  const { data: items, isLoading } = useStaffCertificates(staffId);
  const createCert = useCreateStaffCertificate(staffId);
  const updateCert = useUpdateStaffCertificate(staffId);
  const deleteCert = useDeleteStaffCertificate(staffId);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffCertificateInput>({ name: "", expiresAt: "" });

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", expiresAt: "" });
    setOpen(true);
  }
  function openEdit(c: StaffCertificate) {
    setEditingId(c.id);
    setForm({ name: c.name, expiresAt: c.expiresAt ?? "" });
    setOpen(true);
  }
  async function submit() {
    if (!form.name.trim()) return;
    const payload: StaffCertificateInput = {
      name: form.name.trim(),
      expiresAt: form.expiresAt || undefined,
    };
    if (editingId) await updateCert.mutateAsync({ id: editingId, input: payload });
    else await createCert.mutateAsync(payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Sertifikat nomi va amal qilish muddati</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Sertifikat qo‘shish
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="card grid place-items-center gap-2 py-20 text-center">
          <ShieldCheck className="h-10 w-10 text-ink-muted/50" />
          <p className="font-medium text-ink">Hozircha sertifikatlar yo‘q</p>
          <Button className="mt-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Birinchi sertifikatni qo‘shish
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const tone = expiryTone(c.expiresAt);
            return (
              <Card key={c.id} className="flex items-start gap-3 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-ink">{c.name}</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => openEdit(c)} className="text-ink-muted hover:text-accent" aria-label="Tahrirlash">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteCert.mutate(c.id)} className="text-ink-muted hover:text-negative" aria-label="O‘chirish">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {c.expiresAt ? (
                      <Badge tone={tone}>
                        {tone === "negative" ? "Muddati o‘tgan: " : "Amal qiladi: "}
                        {formatDateDMY(c.expiresAt)}
                      </Badge>
                    ) : (
                      <span>Muddatsiz</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Sertifikatni tahrirlash" : "Yangi sertifikat"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button loading={createCert.isPending || updateCert.isPending} onClick={submit}>
              <ShieldCheck className="h-4 w-4" /> Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Sertifikat nomi" htmlFor="cert-name">
            <Input
              id="cert-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Masalan: IELTS 7.0"
            />
          </Field>
          <Field label="Amal qilish muddati (ixtiyoriy)" htmlFor="cert-exp">
            <DatePicker value={form.expiresAt ?? ""} onChange={(iso) => setForm((f) => ({ ...f, expiresAt: iso }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

// ─── Yutuqlar tab ─────────────────────────────────────────────────────────────

const ACH_CATEGORY_OPTIONS = (Object.keys(STAFF_ACHIEVEMENT_CATEGORY_LABELS) as StaffAchievementCategory[]).map((c) => ({
  value: c,
  label: STAFF_ACHIEVEMENT_CATEGORY_LABELS[c],
}));
const ACH_RANK_OPTIONS = (Object.keys(STAFF_ACHIEVEMENT_RANK_LABELS) as StaffAchievementRank[]).map((r) => ({
  value: r,
  label: STAFF_ACHIEVEMENT_RANK_LABELS[r],
}));
const ACH_ICON_OPTIONS: { value: StaffAchievementIcon; label: string }[] = [
  { value: "trophy", label: "Kubok" },
  { value: "medal", label: "Medal" },
  { value: "award", label: "Mukofot" },
  { value: "star", label: "Yulduzcha" },
  { value: "certificate", label: "Sertifikat" },
  { value: "crown", label: "Toj" },
];

function AchIcon({ icon, className }: { icon: StaffAchievementIcon; className?: string }) {
  const map = { trophy: Trophy, medal: Medal, award: Award, star: Star, certificate: Award, crown: Crown };
  const C = map[icon] ?? Trophy;
  return <C className={className} />;
}

const EMPTY_ACH: StaffAchievementInput = {
  title: "",
  category: "olympiad",
  rank: "first",
  icon: "trophy",
  achievedAt: "",
  organization: "",
  description: "",
  certificateUrl: "",
};

function AchievementsTab({ staffId }: { staffId: string }) {
  const { data: items, isLoading } = useStaffAchievements(staffId);
  const createAch = useCreateStaffAchievement(staffId);
  const updateAch = useUpdateStaffAchievement(staffId);
  const deleteAch = useDeleteStaffAchievement(staffId);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffAchievementInput>(EMPTY_ACH);

  function set<K extends keyof StaffAchievementInput>(key: K, value: StaffAchievementInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_ACH);
    setOpen(true);
  }
  function openEdit(a: StaffAchievement) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      category: a.category,
      rank: a.rank,
      icon: a.icon,
      achievedAt: a.achievedAt ? a.achievedAt.slice(0, 10) : "",
      organization: a.organization ?? "",
      description: a.description ?? "",
      certificateUrl: a.certificateUrl ?? "",
    });
    setOpen(true);
  }
  async function submit() {
    if (!form.title.trim()) return;
    const payload: StaffAchievementInput = {
      ...form,
      title: form.title.trim(),
      achievedAt: form.achievedAt || undefined,
      organization: form.organization || undefined,
      description: form.description || undefined,
      certificateUrl: form.certificateUrl || undefined,
    };
    if (editingId) await updateAch.mutateAsync({ id: editingId, input: payload });
    else await createAch.mutateAsync(payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Xodimning yutuq va mukofotlari</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Yutuq qo‘shish
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="card grid place-items-center gap-2 py-20 text-center">
          <Trophy className="h-10 w-10 text-ink-muted/50" />
          <p className="font-medium text-ink">Hozircha yutuqlar mavjud emas</p>
          <Button className="mt-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Birinchi yutuqni qo‘shish
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Card key={a.id} className="flex items-start gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/12 text-amber-600">
                <AchIcon icon={a.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{a.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button onClick={() => openEdit(a)} className="text-ink-muted hover:text-accent" aria-label="Tahrirlash">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteAch.mutate(a.id)} className="text-ink-muted hover:text-negative" aria-label="O‘chirish">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                    {STAFF_ACHIEVEMENT_CATEGORY_LABELS[a.category]}
                  </span>
                  <span className="rounded-full bg-amber-500/12 px-2 py-0.5 font-medium text-amber-600">
                    {STAFF_ACHIEVEMENT_RANK_LABELS[a.rank]}
                  </span>
                </div>
                {a.organization && <p className="mt-1.5 text-xs text-ink-muted">{a.organization}</p>}
                {a.achievedAt && <p className="text-xs text-ink-muted/70 tnum">{formatDateDMY(a.achievedAt)}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Yutuqni tahrirlash" : "Yangi yutuq qo‘shish"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button loading={createAch.isPending || updateAch.isPending} onClick={submit}>
              <Trophy className="h-4 w-4" /> Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Yutuq nomi" htmlFor="ach-title">
            <Input id="ach-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Masalan: Yilning eng yaxshi o‘qituvchisi" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategoriya" htmlFor="ach-cat">
              <Select id="ach-cat" value={form.category} onChange={(e) => set("category", e.target.value as StaffAchievementCategory)} options={ACH_CATEGORY_OPTIONS} />
            </Field>
            <Field label="O‘rin / daraja" htmlFor="ach-rank">
              <Select id="ach-rank" value={form.rank} onChange={(e) => set("rank", e.target.value as StaffAchievementRank)} options={ACH_RANK_OPTIONS} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ikonka" htmlFor="ach-icon">
              <Select id="ach-icon" value={form.icon} onChange={(e) => set("icon", e.target.value as StaffAchievementIcon)} options={ACH_ICON_OPTIONS} />
            </Field>
            <Field label="Sana" htmlFor="ach-date">
              <DatePicker value={form.achievedAt ?? ""} onChange={(iso) => set("achievedAt", iso)} />
            </Field>
          </div>
          <Field label="Tashkilot / homiy" htmlFor="ach-org">
            <Input id="ach-org" value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="Masalan: Xalq ta‘limi vazirligi" />
          </Field>
          <Field label="Tavsif" htmlFor="ach-desc">
            <textarea
              id="ach-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              placeholder="Yutuq haqida qisqacha ma'lumot..."
            />
          </Field>
          <Field label="Sertifikat URL (ixtiyoriy)" htmlFor="ach-cert">
            <Input id="ach-cert" value={form.certificateUrl} onChange={(e) => set("certificateUrl", e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
