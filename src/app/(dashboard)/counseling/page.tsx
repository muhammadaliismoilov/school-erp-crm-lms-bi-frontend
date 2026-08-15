"use client";

import { useEffect, useState } from "react";
import { Brain, Lock, Plus } from "lucide-react";
import {
  COUNSELING_RISK_LABELS,
  COUNSELING_RISK_LEVELS,
  COUNSELING_SESSION_TYPE_LABELS,
  COUNSELING_SESSION_TYPES,
  useCounselingSession,
  useCounselingSessions,
  useCreateCounselingSession,
  useUpdateCounselingSession,
  type CounselingRiskLevel,
  type CounselingSessionSummary,
  type CounselingSessionType,
} from "@/lib/api/counseling";
import { useClassList } from "@/lib/api/classes";
import { useStudents } from "@/lib/api/students";
import { useAuthStore } from "@/lib/auth/store";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import { Can } from "@/components/auth/can";
import { formatDate } from "@/lib/utils";

const RISK_TONE: Record<CounselingRiskLevel, "positive" | "caution" | "negative"> = {
  low: "positive",
  medium: "caution",
  high: "negative",
};

export default function CounselingPage() {
  const [classFilter, setClassFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const { data: rows, isLoading, isError, refetch } = useCounselingSessions(studentFilter || undefined);
  const { data: classesData } = useClassList();
  const { data: studentsData } = useStudents({ page: 1, limit: 100, classId: classFilter || undefined });

  const classOptions = [
    { value: "", label: "Barcha sinflar" },
    ...(classesData?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const studentOptions = [
    { value: "", label: "Barcha o'quvchilar" },
    ...(studentsData?.items ?? []).map((s) => ({
      value: s.id,
      label: `${s.lastName} ${s.firstName}`,
    })),
  ];

  function openCreate() {
    setEditingId(null);
    setDrawerOpen(true);
  }
  function openEdit(row: CounselingSessionSummary) {
    setEditingId(row.id);
    setDrawerOpen(true);
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Psixolog"
        subtitle="Maslahat seanslari — maxfiy"
        action={
          <Can permission="counseling.create">
            <Button variant="accent" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Yangi seans
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-line bg-parchment-deep px-3.5 py-2.5 text-sm text-ink-soft">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        <span>
          Bu ma'lumot maxfiy — faqat psixolog rolidagi foydalanuvchiga ko'rinadi. Direktor va admin
          ham izohlarni o'qiy olmaydi.
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          className="w-56"
          options={classOptions}
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setStudentFilter("");
          }}
        />
        <Select
          className="w-64"
          options={studentOptions}
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">O'quvchi</th>
                <th className="px-4 py-3 font-medium">Tur</th>
                <th className="px-4 py-3 font-medium">Xavf</th>
                <th className="px-4 py-3 font-medium">Kuzatuv</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma'lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : !rows || rows.length === 0 ? (
                <StateRow><span className="text-ink-muted">Seans topilmadi</span></StateRow>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-parchment-deep/60"
                    onClick={() => openEdit(row)}
                  >
                    <td className="px-4 py-3 tnum text-ink-soft">{formatDate(row.sessionDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <Brain className="h-4 w-4 text-ink-muted" />
                        {row.studentName ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {COUNSELING_SESSION_TYPE_LABELS[row.sessionType as CounselingSessionType] ?? row.sessionType}
                    </td>
                    <td className="px-4 py-3">
                      {row.riskLevel ? (
                        <Badge tone={RISK_TONE[row.riskLevel]}>{COUNSELING_RISK_LABELS[row.riskLevel]}</Badge>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tnum text-ink-soft">
                      {row.followUpDate ? formatDate(row.followUpDate) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SessionDrawer
        open={drawerOpen}
        editingId={editingId}
        prefilledStudentId={studentFilter || undefined}
        classOptions={classOptions.filter((o) => o.value)}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

function StateRow({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-12 text-center">{children}</td>
    </tr>
  );
}

function SessionDrawer({
  open,
  editingId,
  prefilledStudentId,
  classOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingId: string | null;
  prefilledStudentId?: string;
  classOptions: { value: string; label: string }[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const { data: editingSession, isLoading: loadingDetail } = useCounselingSession(editingId);
  const createSession = useCreateCounselingSession();
  const updateSession = useUpdateCounselingSession();

  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [sessionType, setSessionType] = useState<CounselingSessionType>("individual");
  const [sessionDate, setSessionDate] = useState("");
  const [riskLevel, setRiskLevel] = useState<CounselingRiskLevel | "">("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: studentsData } = useStudents({ page: 1, limit: 100, classId: classId || undefined });
  const studentOptions = (studentsData?.items ?? []).map((s) => ({
    value: s.id,
    label: `${s.lastName} ${s.firstName}`,
  }));

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      if (!editingSession) return; // hali yuklanmoqda — pastdagi effekt to'ldiradi
      setStudentId(editingSession.studentId);
      setSessionType(editingSession.sessionType as CounselingSessionType);
      setSessionDate(toLocalInput(editingSession.sessionDate));
      setRiskLevel((editingSession.riskLevel as CounselingRiskLevel) ?? "");
      setFollowUpDate(editingSession.followUpDate ?? "");
      setNotes(editingSession.notes);
    } else {
      setClassId("");
      setStudentId(prefilledStudentId ?? "");
      setSessionType("individual");
      setSessionDate(toLocalInput(new Date().toISOString()));
      setRiskLevel("");
      setFollowUpDate("");
      setNotes("");
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId, editingSession, prefilledStudentId]);

  async function submit() {
    if (!studentId || !sessionDate || !notes.trim()) {
      setError("O'quvchi, sana va izohni to'ldiring");
      return;
    }
    if (!currentUser) {
      setError("Foydalanuvchi aniqlanmadi — qaytadan kiring");
      return;
    }

    const payload = {
      studentId,
      counselorId: currentUser.id,
      sessionDate: new Date(sessionDate).toISOString(),
      sessionType,
      notes: notes.trim(),
      riskLevel: riskLevel || undefined,
      followUpDate: followUpDate || undefined,
    };

    try {
      if (editingId) {
        await updateSession.mutateAsync({ id: editingId, input: payload });
        onSaved("Seans yangilandi");
      } else {
        await createSession.mutateAsync(payload);
        onSaved("Seans qo'shildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createSession.isPending || updateSession.isPending;
  const busy = Boolean(editingId) && loadingDetail;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingId ? "Seansni tahrirlash" : "Yangi seans"}
      icon={<Brain className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} disabled={busy} onClick={submit}>
            {editingId ? "Saqlash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      {busy ? (
        <div className="grid place-items-center py-16"><Spinner className="h-6 w-6" /></div>
      ) : (
        <div className="space-y-4">
          {!editingId && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sinf">
                <Select
                  options={[{ value: "", label: "Tanlang" }, ...classOptions]}
                  value={classId}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    setStudentId("");
                  }}
                />
              </Field>
              <Field label="O'quvchi">
                <Select
                  options={[{ value: "", label: "Tanlang" }, ...studentOptions]}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Seans turi">
              <Select
                options={COUNSELING_SESSION_TYPES.map((t) => ({ value: t, label: COUNSELING_SESSION_TYPE_LABELS[t] }))}
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as CounselingSessionType)}
              />
            </Field>
            <Field label="Sana va vaqt">
              <Input type="datetime-local" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Xavf darajasi (ixtiyoriy)">
              <Select
                options={[{ value: "", label: "Belgilanmagan" }, ...COUNSELING_RISK_LEVELS.map((r) => ({ value: r, label: COUNSELING_RISK_LABELS[r] }))]}
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as CounselingRiskLevel | "")}
              />
            </Field>
            <Field label="Kuzatuv sanasi (ixtiyoriy)">
              <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Izoh">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Seans mazmuni, kuzatuvlar..."
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
            />
          </Field>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Lock className="h-3.5 w-3.5" /> Bu matn shifrlangan holda saqlanadi.
          </p>

          {error && <div className="text-sm text-negative">{error}</div>}
        </div>
      )}
    </Drawer>
  );
}

/** ISO datetime → `datetime-local` input kutgan mahalliy `YYYY-MM-DDTHH:mm`. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
