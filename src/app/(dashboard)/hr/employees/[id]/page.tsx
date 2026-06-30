"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_TONE,
  GENDER_LABELS,
  QUALIFICATION_LABELS,
  useStaffMember,
  type StaffMember,
} from "@/lib/api/hr";
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
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Ma'lumotlar" },
  { key: "certificates", label: "Sertifikatlar" },
  { key: "achievements", label: "Yutuqlar" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tab, setTab] = useState<TabKey>("overview");

  const { data: staff, isLoading } = useStaffMember(id);

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
      </div>

      {/* Tab nav */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab staff={staff} />}
      {tab === "certificates" && <CertificatesTab staffId={id} />}
      {tab === "achievements" && <AchievementsTab staffId={id} />}
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
