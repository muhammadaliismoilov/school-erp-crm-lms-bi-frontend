"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, GraduationCap, Link2, Search, UserPlus, Users, X } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { useList, type ResourceRecord } from "@/lib/api/resource";
import { useLinkParents } from "@/lib/api/parents";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, Spinner } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/ui/page-header";
import { CredentialsModal } from "@/components/users/credentials-modal";
import { cn, fullName, loc } from "@/lib/utils";

const RELATIONS = [
  { value: "father", label: "Ota" },
  { value: "mother", label: "Ona" },
  { value: "guardian", label: "Vasiy" },
  { value: "relative", label: "Qarindosh" },
];

/** A picked student or parent, kept with its label so chips survive search changes. */
interface Picked {
  id: string;
  label: string;
  sub?: string;
}

export default function StudentParentPage() {
  const { t, locale } = useI18n();

  const [studentSearch, setStudentSearch] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [students, setStudents] = useState<Picked[]>([]);
  const [parents, setParents] = useState<Picked[]>([]);
  const [relation, setRelation] = useState("guardian");
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedCount, setLinkedCount] = useState<number | null>(null);

  const studentsQ = useList("sp-students", "/students", {
    search: studentSearch.trim() || undefined,
    limit: 50,
  });
  const parentsQ = useList("sp-parents", "/users", {
    role: "PARENT",
    search: parentSearch.trim() || undefined,
    limit: 50,
  });

  const link = useLinkParents();

  function toggle(list: Picked[], setList: (v: Picked[]) => void, item: Picked) {
    setLinkedCount(null);
    setError(null);
    setList(
      list.some((p) => p.id === item.id)
        ? list.filter((p) => p.id !== item.id)
        : [...list, item],
    );
  }

  function studentPicked(s: ResourceRecord): Picked {
    return {
      id: s.id,
      label: fullName(s),
      sub: [loc((s.currentClass as Record<string, unknown>)?.name), String(s.studentCode ?? "")]
        .filter(Boolean)
        .join(" · "),
    };
  }
  function parentPicked(p: ResourceRecord): Picked {
    return {
      id: p.id,
      label: String(p.fullName ?? p.login ?? p.id),
      sub: [String(p.phone ?? ""), String(p.login ?? "")].filter(Boolean).join(" · "),
    };
  }

  async function submit() {
    setError(null);
    setLinkedCount(null);
    if (students.length === 0 || parents.length === 0) {
      setError("Iltimos, kamida bitta o‘quvchi va ota-onani tanlang!");
      return;
    }
    try {
      const r = await link.mutateAsync({
        studentIds: students.map((s) => s.id),
        parentIds: parents.map((p) => p.id),
        relation,
        isPrimary,
      });
      setLinkedCount(r.linked);
      setStudents([]);
      setParents([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.localized(locale) : t("common.error"));
    }
  }

  // --- Yangi ota-ona yaratish ---
  const EMPTY_NP = { firstName: "", lastName: "", phone: "", email: "", gender: "" };
  const [npOpen, setNpOpen] = useState(false);
  const [np, setNp] = useState(EMPTY_NP);
  const [npError, setNpError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ login: string; password: string } | null>(null);

  const createParent = useMutation({
    mutationFn: () =>
      apiRequest<{ id: string; login: string; fullName: string; generatedPassword: string }>(
        "/students/parents",
        {
          method: "POST",
          body: {
            firstName: np.firstName.trim(),
            lastName: np.lastName.trim() || undefined,
            phone: np.phone.trim(),
            email: np.email.trim() || undefined,
            gender: np.gender || undefined,
          },
        },
      ),
  });

  async function submitNewParent() {
    setNpError(null);
    if (!np.firstName.trim() || !np.phone.trim()) {
      setNpError("Ism va telefon raqami majburiy");
      return;
    }
    try {
      const created = await createParent.mutateAsync();
      // Auto-select the freshly created parent and surface its credentials once.
      setParents((prev) => [
        ...prev,
        { id: created.id, label: created.fullName || created.login, sub: created.login },
      ]);
      setCredentials({ login: created.login, password: created.generatedPassword });
      setNp(EMPTY_NP);
      setNpOpen(false);
      parentsQ.refetch();
    } catch (e) {
      setNpError(e instanceof ApiError ? e.localized(locale) : t("common.error"));
    }
  }

  return (
    <div className="stagger pb-24">
      <PageHeader
        title={t("nav.ac.studentParent")}
        subtitle="O‘quvchilar va ota-onalarni tanlab, bir vaqtning o‘zida biriktiring"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <PickColumn
          title="O‘quvchi qidirish"
          icon={<GraduationCap className="h-4 w-4" />}
          selectedTitle="TANLANGAN O‘QUVCHILAR"
          search={studentSearch}
          onSearch={setStudentSearch}
          loading={studentsQ.isLoading}
          rows={studentsQ.rows}
          mapRow={studentPicked}
          selected={students}
          onToggle={(item) => toggle(students, setStudents, item)}
          emptyIcon={<GraduationCap className="h-9 w-9" />}
          placeholder="Ism, kod yoki telefon bo‘yicha qidirish"
        />

        <PickColumn
          title="Ota-ona qidirish"
          icon={<Users className="h-4 w-4" />}
          selectedTitle="TANLANGAN OTA-ONALAR"
          search={parentSearch}
          onSearch={setParentSearch}
          loading={parentsQ.isLoading}
          rows={parentsQ.rows}
          mapRow={parentPicked}
          selected={parents}
          onToggle={(item) => toggle(parents, setParents, item)}
          emptyIcon={<Users className="h-9 w-9" />}
          placeholder="Ism, login yoki telefon bo‘yicha qidirish"
          headerAction={
            <Can permission="users.create">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNpError(null);
                  setNpOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" /> Yangi
              </Button>
            </Can>
          }
        />
      </div>

      {/* Pastki biriktirish paneli */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/12 text-accent">
              <Link2 className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">Biriktirish</p>
              <p className="text-xs text-ink-muted">
                {students.length === 0 || parents.length === 0
                  ? "Iltimos, kamida bitta o‘quvchi va ota-onani tanlang!"
                  : `${students.length} o‘quvchi × ${parents.length} ota-ona = ${students.length * parents.length} bog‘lanish`}
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
            >
              {RELATIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-accent"
              />
              Asosiy vakil
            </label>
            <Can permission="student-parents.create" mode="disable">
              <Button
                variant="accent"
                loading={link.isPending}
                disabled={students.length === 0 || parents.length === 0}
                onClick={submit}
              >
                <Link2 className="h-4 w-4" /> Biriktirish
              </Button>
            </Can>
          </div>
        </div>

        {(error || linkedCount !== null) && (
          <div className="mx-auto max-w-[1400px] px-6 pb-2">
            {error && <p className="text-sm text-negative">{error}</p>}
            {linkedCount !== null && (
              <p className="text-sm text-positive">
                {linkedCount} ta bog‘lanish muvaffaqiyatli yaratildi
              </p>
            )}
          </div>
        )}
      </div>

      {/* Yangi ota-ona modali */}
      <Modal
        open={npOpen}
        onClose={() => setNpOpen(false)}
        size="md"
        title="Yangi ota-ona yaratish"
        subtitle="Login va parol avtomatik yaratiladi"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNpOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="accent" loading={createParent.isPending} onClick={submitNewParent}>
              <UserPlus className="h-4 w-4" /> Yaratish va tanlash
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ism">
              <Input
                value={np.firstName}
                onChange={(e) => setNp((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Dilshod"
              />
            </Field>
            <Field label="Familiya (ixtiyoriy)">
              <Input
                value={np.lastName}
                onChange={(e) => setNp((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Valiyev"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefon">
              <Input
                value={np.phone}
                onChange={(e) => setNp((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+998901234567"
              />
            </Field>
            <Field label="Email (ixtiyoriy)">
              <Input
                type="email"
                value={np.email}
                onChange={(e) => setNp((f) => ({ ...f, email: e.target.value }))}
                placeholder="parent@example.com"
              />
            </Field>
          </div>
          <Field label="Jinsi (ixtiyoriy)" htmlFor="np-gender">
            <select
              id="np-gender"
              value={np.gender}
              onChange={(e) => setNp((f) => ({ ...f, gender: e.target.value }))}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-amber focus-visible:focus-ring"
            >
              <option value="">Tanlanmagan</option>
              <option value="male">Erkak</option>
              <option value="female">Ayol</option>
            </select>
          </Field>

          {npError && (
            <p className="rounded-lg border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative">
              {npError}
            </p>
          )}
        </div>
      </Modal>

      <CredentialsModal
        open={Boolean(credentials)}
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </div>
  );
}

interface PickColumnProps {
  title: string;
  icon: React.ReactNode;
  selectedTitle: string;
  search: string;
  onSearch: (v: string) => void;
  loading: boolean;
  rows: ResourceRecord[];
  mapRow: (r: ResourceRecord) => Picked;
  selected: Picked[];
  onToggle: (item: Picked) => void;
  emptyIcon: React.ReactNode;
  placeholder: string;
  headerAction?: React.ReactNode;
}

function PickColumn({
  title,
  icon,
  selectedTitle,
  search,
  onSearch,
  loading,
  rows,
  mapRow,
  selected,
  onToggle,
  emptyIcon,
  placeholder,
  headerAction,
}: PickColumnProps) {
  const selectedIds = new Set(selected.map((s) => s.id));
  return (
    <Card className="flex max-h-[70vh] flex-col overflow-hidden p-0">
      {/* Sarlavha */}
      <div className="flex items-center justify-between gap-2 bg-accent/10 px-4 py-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-accent">
          {icon}
          {title}
        </h3>
        {headerAction}
      </div>

      {/* Qidiruv */}
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tanlanganlar */}
      <div className="border-b border-line px-3 py-2">
        <p className="label mb-2">{selectedTitle}</p>
        {selected.length === 0 ? (
          <p className="text-xs text-ink-muted">Hozircha tanlanmagan</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 py-1 pl-3 pr-1.5 text-xs font-medium text-accent"
              >
                {s.label}
                <button
                  type="button"
                  onClick={() => onToggle(s)}
                  className="grid h-4 w-4 place-items-center rounded-full hover:bg-accent/20"
                  aria-label="Olib tashlash"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Natijalar */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Spinner className="h-5 w-5" />
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-center text-ink-muted/60">
            {emptyIcon}
            <p className="text-sm">{title}</p>
          </div>
        ) : (
          <ul className="divide-y divide-line/60">
            {rows.map((r) => {
              const item = mapRow(r);
              const active = selectedIds.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      active ? "bg-accent/10" : "hover:bg-parchment",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                        active ? "border-accent bg-accent text-accent-fg" : "border-line",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{item.label}</span>
                      {item.sub && (
                        <span className="block truncate text-xs text-ink-muted">{item.sub}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
