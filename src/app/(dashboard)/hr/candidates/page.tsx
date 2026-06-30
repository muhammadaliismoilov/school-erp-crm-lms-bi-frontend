"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserSearch,
} from "lucide-react";
import {
  PAGE_SIZES,
  STAGE_LABELS,
  STAGE_ORDER,
  STAGE_TONE,
  useCandidateList,
  useCreateCandidate,
  useDeleteCandidate,
  useUpdateCandidate,
  useUpdateCandidateStage,
  type Candidate,
  type CandidateInput,
  type CandidateStage,
} from "@/lib/api/hr-candidates";
import { useVacancyList } from "@/lib/api/hr-vacancies";
import { useStaff } from "@/lib/api/hr";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

const STAGE_OPTIONS = STAGE_ORDER.map((s) => ({ value: s, label: STAGE_LABELS[s] }));

export default function CandidatesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<CandidateStage | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [stageFor, setStageFor] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState<Candidate | null>(null);
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

  const { data, isLoading, isError, refetch } = useCandidateList({
    page,
    limit,
    search,
    stage: stage || undefined,
  });
  const deleteCandidate = useDeleteCandidate();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteCandidate.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Nomzod o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Nomzodlar"
        subtitle="Ish nomzodlarini boshqarish"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yaratish
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Nomzodlarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          className="h-10 w-44"
          value={stage}
          onChange={(e) => {
            setStage(e.target.value as CandidateStage | "");
            setPage(1);
          }}
          options={[{ value: "", label: "Barchasi" }, ...STAGE_OPTIONS]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Ism</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Vakansiya</th>
                <th className="px-4 py-3 font-medium">Bosqich</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={7}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={7}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma'lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={7}><span className="text-ink-muted">Ma'lumot yo'q</span></StateRow>
              ) : (
                rows.map((c, i) => (
                  <tr key={c.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-parchment text-ink-soft">
                          <UserSearch className="h-4 w-4" />
                        </span>
                        {c.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-ink-muted" />{c.email}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {c.phone ? <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-ink-muted" />{c.phone}</span> : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{c.vacancyTitle ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1.5"
                        title="Bosqichni yangilash"
                        onClick={() => setStageFor(c)}
                      >
                        <Badge tone={STAGE_TONE[c.stage]}>{STAGE_LABELS[c.stage]}</Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-amber" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(c);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O'chirish"
                          onClick={() => setDeleting(c)}
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

      <CandidateDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <StageDrawer
        candidate={stageFor}
        onClose={() => setStageFor(null)}
        onSaved={(msg) => {
          setStageFor(null);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Nomzodni o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.fullName} o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteCandidate.isPending} onClick={confirmDelete}>O'chirish</Button>
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
      <td colSpan={colSpan} className="px-4 py-12 text-center">{children}</td>
    </tr>
  );
}

function CandidateDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Candidate | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const { data: vacancies } = useVacancyList({ page: 1, limit: 100 });
  const { data: staffList } = useStaff({ page: 1, limit: 100 });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vacancyId, setVacancyId] = useState("");
  const [stage, setStage] = useState<CandidateStage>("new");
  const [recruiterId, setRecruiterId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setFirstName(editing.firstName);
      setLastName(editing.lastName);
      setEmail(editing.email);
      setPhone(editing.phone ?? "");
      setVacancyId(editing.vacancyId ?? "");
      setStage(editing.stage);
      setRecruiterId(editing.recruiterId ?? "");
      setNotes(editing.notes ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setVacancyId("");
      setStage("new");
      setRecruiterId("");
      setNotes("");
    }
    setError(null);
  }, [open, editing]);

  const vacancyOptions = useMemo(
    () => [{ value: "", label: "Vakansiyani tanlang..." }, ...(vacancies?.items ?? []).map((v) => ({ value: v.id, label: v.title }))],
    [vacancies],
  );
  const recruiterOptions = useMemo(
    () => [
      { value: "", label: "Rekruter tanlang" },
      ...(staffList?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` })),
    ],
    [staffList],
  );

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Ism va familiyani kiriting");
      return;
    }
    if (!email.trim()) {
      setError("Email kiriting");
      return;
    }
    const payload: CandidateInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      vacancyId: vacancyId || undefined,
      stage,
      recruiterId: recruiterId || undefined,
      notes: notes.trim() || undefined,
    };
    try {
      if (editing) {
        await updateCandidate.mutateAsync({ id: editing.id, input: payload });
        onSaved("Nomzod yangilandi");
      } else {
        await createCandidate.mutateAsync(payload);
        onSaved("Nomzod yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createCandidate.isPending || updateCandidate.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Nomzodni yangilash" : "Nomzod qo'shish"}
      subtitle="Yangi ish nomzodini qo'shish"
      icon={<UserSearch className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            {editing ? "Yangilash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ism" required>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ismni kiriting" />
          </Field>
          <Field label="Familiya" required>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familiyani kiriting" />
          </Field>
        </div>
        <Field label="Email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Emailni kiriting" />
        </Field>
        <Field label="Telefon">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon raqamini kiriting" />
        </Field>
        <Field label="Vakansiya">
          <Select value={vacancyId} onChange={(e) => setVacancyId(e.target.value)} options={vacancyOptions} />
        </Field>
        <Field label="Bosqich">
          <Select value={stage} onChange={(e) => setStage(e.target.value as CandidateStage)} options={STAGE_OPTIONS} />
        </Field>
        <Field label="Rekruter">
          <Select value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} options={recruiterOptions} />
        </Field>
        <Field label="Izohlar">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Izohlarni kiriting..."
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}

function StageDrawer({
  candidate,
  onClose,
  onSaved,
}: {
  candidate: Candidate | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const updateStage = useUpdateCandidateStage();
  const [stage, setStage] = useState<CandidateStage>("new");
  const [stageStatus, setStageStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidate) return;
    setStage(candidate.stage);
    setStageStatus(candidate.stageStatus ?? "");
    setError(null);
  }, [candidate]);

  async function submit() {
    if (!candidate) return;
    try {
      await updateStage.mutateAsync({ id: candidate.id, input: { stage, stageStatus: stageStatus.trim() || undefined } });
      onSaved("Bosqich yangilandi");
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  return (
    <Drawer
      open={!!candidate}
      onClose={onClose}
      title="Nomzodni yangilash"
      subtitle={candidate ? `${candidate.fullName} uchun bosqichni yangilash` : undefined}
      icon={<UserSearch className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={updateStage.isPending} onClick={submit}>Yangilash</Button>
        </div>
      }
    >
      {candidate && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-parchment/40 p-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <div className="text-xs text-ink-muted">Email</div>
                <div className="text-ink">{candidate.email}</div>
              </div>
              <div>
                <div className="text-xs text-ink-muted">Telefon</div>
                <div className="text-ink">{candidate.phone ?? "—"}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-ink-muted">Joriy bosqich</span>
              <Badge tone={STAGE_TONE[candidate.stage]}>{STAGE_LABELS[candidate.stage]}</Badge>
            </div>
          </div>
          <Field label="Bosqich" required>
            <Select value={stage} onChange={(e) => setStage(e.target.value as CandidateStage)} options={STAGE_OPTIONS} />
          </Field>
          <Field label="Bosqich statusi">
            <Input
              value={stageStatus}
              onChange={(e) => setStageStatus(e.target.value)}
              placeholder="Bosqich statusini kiriting"
            />
            <p className="mt-1 text-xs text-ink-muted">Joriy bosqich uchun ixtiyoriy status</p>
          </Field>
          {error && <div className="text-sm text-negative">{error}</div>}
        </div>
      )}
    </Drawer>
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
