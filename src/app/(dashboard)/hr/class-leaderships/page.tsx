"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import {
  CLASS_LEADER_STATUS_LABELS,
  classLeaderStatus,
  useClassLeaderList,
  useCreateClassLeader,
  useDeleteClassLeader,
  useUpdateClassLeader,
  type ClassLeaderAssignment,
  type ClassLeaderStatus,
} from "@/lib/api/hr-class-leaderships";
import { useClassList } from "@/lib/api/classes";
import { useTeacherList } from "@/lib/api/hr-teachers";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import {
  RowActions,
  useAnyRowAction,
  type RowAction,
} from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";
import { formatDate } from "@/lib/utils";

const STATUS_TONE: Record<ClassLeaderStatus, "positive" | "accent" | "neutral"> = {
  active: "positive",
  upcoming: "accent",
  ended: "neutral",
};

export default function ClassLeadershipsPage() {
  const [classFilter, setClassFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  // Sukut bo'yicha O'CHIQ: yoqilgan holda kelajak sanali yangi biriktiruv
  // yaratilgach ro'yxatdan darhol g'oyib bo'lardi ("saqlandimi o'zi?" degan
  // chalkashlik). Admin xohlasa o'zi yoqadi — buni brauzer tekshiruvida topdim.
  const [onlyActive, setOnlyActive] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ClassLeaderAssignment | null>(null);
  const [deleting, setDeleting] = useState<ClassLeaderAssignment | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const today = new Date().toISOString().slice(0, 10);
  const { data: rows, isLoading, isError, refetch } = useClassLeaderList({
    classId: classFilter || undefined,
    teacherId: teacherFilter || undefined,
    activeOn: onlyActive ? today : undefined,
  });
  const { data: classesData } = useClassList();
  const { data: teachersData } = useTeacherList({ page: 1, limit: 100 }); // backend maks. 100
  const deleteAssignment = useDeleteClassLeader();

  const classOptions = [
    { value: "", label: "Barcha sinflar" },
    ...(classesData?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const teacherOptions = [
    { value: "", label: "Barcha o'qituvchilar" },
    ...(teachersData?.items ?? []).map((t) => ({ value: t.id, label: t.fullName })),
  ];

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteAssignment.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Biriktiruv o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  const rowActions: RowAction<ClassLeaderAssignment>[] = [
    {
      key: "update",
      label: "Yopish / tahrirlash",
      icon: Pencil,
      permission: "hr-class-leaderships.update",
      onSelect: (a) => {
        setEditing(a);
        setDrawerOpen(true);
      },
    },
    {
      key: "delete",
      label: "O'chirish",
      icon: Trash2,
      tone: "danger",
      permission: "hr-class-leaderships.delete",
      onSelect: (a) => setDeleting(a),
    },
  ];
  const showActions = useAnyRowAction(rowActions);
  const colCount = showActions ? 6 : 5;

  return (
    <div className="stagger">
      <PageHeader
        title="Sinf rahbarligi"
        subtitle="Kim, qaysi sinfga, qachondan rahbar — oylik dvigateli shu biriktiruvlardan hisoblaydi"
        action={
          <Can permission="hr-class-leaderships.create">
            <Button
              variant="accent"
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yangi biriktiruv
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select className="w-56" options={classOptions} value={classFilter} onChange={(e) => setClassFilter(e.target.value)} />
        <Select className="w-56" options={teacherOptions} value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Faqat faollar
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">O'qituvchi</th>
                <th className="px-4 py-3 font-medium">Sinf</th>
                <th className="px-4 py-3 font-medium">Davr</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 font-medium">Izoh</th>
                {showActions && <th className="px-4 py-3 text-right font-medium">Amallar</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={colCount}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={colCount}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma'lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : !rows || rows.length === 0 ? (
                <StateRow colSpan={colCount}><span className="text-ink-muted">Biriktiruv topilmadi</span></StateRow>
              ) : (
                rows.map((a) => {
                  const status = classLeaderStatus(a);
                  return (
                    <tr key={a.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <GraduationCap className="h-4 w-4 text-ink-muted" />
                          {a.teacherName ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{a.className ?? "—"}</td>
                      <td className="px-4 py-3 tnum text-ink-soft">
                        {formatDate(a.startDate)} — {a.endDate ? formatDate(a.endDate) : "hozirgacha"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[status]}>{CLASS_LEADER_STATUS_LABELS[status]}</Badge>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-ink-soft" title={a.note ?? ""}>
                        {a.note ?? "—"}
                      </td>
                      {showActions && (
                        <td className="px-4 py-3">
                          <RowActions row={a} actions={rowActions} />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClassLeaderDrawer
        open={drawerOpen}
        editing={editing}
        classOptions={classOptions.filter((o) => o.value)}
        teacherOptions={teacherOptions.filter((o) => o.value)}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Biriktiruvni o'chirish">
        <p className="text-sm text-ink-muted">
          {deleting?.teacherName} — {deleting?.className} biriktiruvi butunlay o'chiriladi. Odatda xato
          kiritilgan yozuv uchun; tarixiy o'zgarishni esa "Yopish" bilan sana qo'yib yakunlang. Davom
          etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteAssignment.isPending} onClick={confirmDelete}>O'chirish</Button>
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

function ClassLeaderDrawer({
  open,
  editing,
  classOptions,
  teacherOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: ClassLeaderAssignment | null;
  classOptions: { value: string; label: string }[];
  teacherOptions: { value: string; label: string }[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createAssignment = useCreateClassLeader();
  const updateAssignment = useUpdateClassLeader();

  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setClassId(editing.classId);
      setTeacherId(editing.teacherId);
      setStartDate(editing.startDate);
      setEndDate(editing.endDate ?? "");
      setNote(editing.note ?? "");
    } else {
      setClassId("");
      setTeacherId("");
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate("");
      setNote("");
    }
    setError(null);
  }, [open, editing]);

  async function submit() {
    if (editing) {
      try {
        await updateAssignment.mutateAsync({
          id: editing.id,
          input: { endDate: endDate || undefined, note: note.trim() || undefined },
        });
        onSaved("Biriktiruv yangilandi");
      } catch {
        setError("Saqlashda xatolik yuz berdi");
      }
      return;
    }

    if (!classId || !teacherId || !startDate) {
      setError("Sinf, o'qituvchi va boshlanish sanasini tanlang");
      return;
    }
    try {
      await createAssignment.mutateAsync({
        classId,
        teacherId,
        startDate,
        endDate: endDate || undefined,
        note: note.trim() || undefined,
      });
      onSaved("Biriktiruv yaratildi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createAssignment.isPending || updateAssignment.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Rahbarlikni yopish / tahrirlash" : "Yangi biriktiruv"}
      icon={<GraduationCap className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            {editing ? "Saqlash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {editing ? (
          <div className="rounded-lg bg-parchment-deep px-3 py-2 text-sm text-ink-soft">
            {editing.teacherName} — {editing.className}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sinf">
              <Select options={[{ value: "", label: "Tanlang" }, ...classOptions]} value={classId} onChange={(e) => setClassId(e.target.value)} />
            </Field>
            <Field label="O'qituvchi">
              <Select options={[{ value: "", label: "Tanlang" }, ...teacherOptions]} value={teacherId} onChange={(e) => setTeacherId(e.target.value)} />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Boshlanish sanasi">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={Boolean(editing)} />
          </Field>
          <Field label="Tugash sanasi">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} />
          </Field>
        </div>
        {editing && (
          <p className="text-xs text-ink-muted">
            Tugash sanasi bo'sh qoldirilsa — rahbarlik hozircha davom etadi. Sana qo'yilsa, oylik
            dvigateli shu kunga qadar proporsional hisoblaydi.
          </p>
        )}

        <Field label="Izoh (ixtiyoriy)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Masalan: almashtirish sababi"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}
