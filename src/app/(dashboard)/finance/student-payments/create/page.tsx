"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  MONTH_LABELS,
  STATUS_LABELS,
  useCreateStudentPayment,
  useStudentPayment,
  useStudentPaymentOptions,
  useUpdateStudentPayment,
  type StudentPaymentInput,
  type StudentPaymentStatus,
} from "@/lib/api/student-payments";
import { useClassList } from "@/lib/api/classes";
import { useStudents } from "@/lib/api/students";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { AgreementPanel } from "@/components/finance/agreement-panel";
import { useCan } from "@/lib/auth/use-can";

const MONTH_OPTIONS = MONTH_LABELS.map((m, i) => ({ value: String(i + 1), label: m }));

/**
 * Holatni summa va rejaga qarab aniqlaydi — backend `deriveStatus` bilan bir xil
 * mantiq. Foydalanuvchi holatni qo'lda tanlamaydi; faqat natijani ko'radi.
 */
function deriveStatus(amount: number | null, planAmount: number | null): StudentPaymentStatus {
  const paid = amount ?? 0;
  const plan = planAmount ?? 0;
  if (paid <= 0) return "pending";
  if (plan > 0 && paid < plan) return "partial";
  return "paid";
}

interface FormState {
  classId: string;
  studentId: string;
  amount: number | null;
  planAmount: number | null;
  paymentTypeId: string;
  paymentDate: string;
  month: string;
  receiptNumber: string;
  note: string;
}

const emptyForm = (): FormState => ({
  classId: "",
  studentId: "",
  amount: null,
  planAmount: null,
  paymentTypeId: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  month: String(new Date().getMonth() + 1),
  receiptNumber: "",
  note: "",
});

function StudentPaymentForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const isEdit = !!editId;

  const can = useCan();
  // Yaratish va tahrirlash — alohida huquqlar; forma qaysi rejimda ochilganiga qarab.
  const canManage = can(isEdit ? "student-payments.update" : "student-payments.create");

  const { data: options } = useStudentPaymentOptions();
  const { data: classesData } = useClassList();
  const { data: existing } = useStudentPayment(editId);
  const createPayment = useCreateStudentPayment();
  const updatePayment = useUpdateStudentPayment();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Tahrirlash rejimida mavjud yozuvni formaga yuklash.
  useEffect(() => {
    if (!existing) return;
    setForm({
      classId: existing.classId ?? "",
      studentId: existing.studentId ?? "",
      amount: existing.amount,
      planAmount: existing.planAmount ?? null,
      paymentTypeId: existing.paymentTypeId ?? "",
      paymentDate: existing.paymentDate,
      month: String(existing.month),
      receiptNumber: existing.receiptNumber,
      note: existing.note ?? "",
    });
  }, [existing]);

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
    setError(null);
    setSavedMessage(null);
  }

  const { data: studentsData } = useStudents({ page: 1, limit: 100, classId: form.classId || undefined });

  const classOptions = useMemo(
    () => [{ value: "", label: "Barcha sinflar" }, ...(classesData?.items ?? []).map((c) => ({ value: c.id, label: c.name }))],
    [classesData],
  );
  const studentOptions = useMemo(
    () => [
      { value: "", label: "O‘quvchini tanlang" },
      ...(studentsData?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}`.trim() })),
    ],
    [studentsData],
  );
  const paymentTypeOptions = useMemo(
    () => [
      { value: "", label: "To‘lov turini tanlang" },
      ...(options?.paymentTypes ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [options],
  );

  function buildPayload(): StudentPaymentInput | null {
    if (!form.studentId) {
      setError("O‘quvchini tanlang");
      return null;
    }
    if (form.amount == null || form.amount < 0) {
      setError("Summa 0 dan kichik bo‘lmasligi kerak");
      return null;
    }
    return {
      studentId: form.studentId,
      amount: form.amount,
      planAmount: form.planAmount ?? undefined,
      paymentTypeId: form.paymentTypeId || undefined,
      paymentDate: form.paymentDate || undefined,
      month: form.month ? Number(form.month) : undefined,
      receiptNumber: form.receiptNumber.trim() || undefined,
      note: form.note.trim() || undefined,
    };
  }

  async function submit(stayOnPage: boolean) {
    const payload = buildPayload();
    if (!payload) return;
    try {
      if (isEdit && editId) {
        await updatePayment.mutateAsync({ id: editId, input: payload });
        router.push("/finance/student-payments");
        return;
      }
      await createPayment.mutateAsync(payload);
      if (stayOnPage) {
        setForm((prev) => ({ ...emptyForm(), classId: prev.classId }));
        setSavedMessage("To‘lov saqlandi. Yangisini kiriting.");
      } else {
        router.push("/finance/student-payments");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const derivedStatus = deriveStatus(form.amount, form.planAmount);
  const busy = createPayment.isPending || updatePayment.isPending;

  if (!canManage) {
    return <div className="card p-8 text-center text-ink-muted">Ushbu amal uchun ruxsatingiz yo‘q.</div>;
  }

  return (
    <div className="stagger">
      <button
        onClick={() => router.push("/finance/student-payments")}
        className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> To‘lovlar
      </button>
      <PageHeader
        title={isEdit ? "To‘lovni tahrirlash" : "To‘lov qo‘shish"}
        subtitle="O‘quvchi to‘lovini kiritish"
      />

      <div className="card space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sinf">
            <Select
              options={classOptions}
              value={form.classId}
              onChange={(e) => patch({ classId: e.target.value, studentId: "" })}
            />
          </Field>
          <Field label="O‘quvchi">
            <Select
              options={studentOptions}
              value={form.studentId}
              placeholder="O‘quvchini tanlang"
              onChange={(e) => patch({ studentId: e.target.value })}
            />
          </Field>
        </div>

        {/* O'quvchi tanlanganda — to'lov kelishuvi (reja, jadval, keyingi to'lov) */}
        {form.studentId && <AgreementPanel studentId={form.studentId} />}

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Summa">
            <NumberInput value={form.amount} onChange={(v) => patch({ amount: v })} placeholder="To‘langan summa" />
          </Field>
          <Field label="Oylik reja (ixtiyoriy)">
            <NumberInput value={form.planAmount} onChange={(v) => patch({ planAmount: v })} placeholder="Kutilgan summa" />
          </Field>
          <Field label="To‘lov turi">
            <Select
              options={paymentTypeOptions}
              value={form.paymentTypeId}
              placeholder="To‘lov turini tanlang"
              onChange={(e) => patch({ paymentTypeId: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="To‘lov sanasi">
            <DatePicker value={form.paymentDate} onChange={(iso) => patch({ paymentDate: iso })} />
          </Field>
          <Field label="Oy">
            <Select options={MONTH_OPTIONS} value={form.month} onChange={(e) => patch({ month: e.target.value })} />
          </Field>
          <Field label="Holat (avtomatik)">
            <div className="flex h-[38px] items-center rounded-lg border border-dashed border-line bg-surface px-3 text-sm">
              <span
                className={
                  derivedStatus === "paid"
                    ? "font-medium text-emerald-600"
                    : derivedStatus === "partial"
                      ? "font-medium text-amber-600"
                      : "font-medium text-ink-muted"
                }
              >
                {STATUS_LABELS[derivedStatus]}
              </span>
            </div>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kvitansiya raqami (ixtiyoriy)">
            <input
              value={form.receiptNumber}
              onChange={(e) => patch({ receiptNumber: e.target.value })}
              placeholder="Avtomatik (KV-YYYY-NNNNN)"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus:border-amber focus-visible:focus-ring"
            />
          </Field>
          <Field label="Izoh (ixtiyoriy)">
            <textarea
              value={form.note}
              onChange={(e) => patch({ note: e.target.value })}
              rows={3}
              placeholder="Izoh kiriting"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus:border-amber focus-visible:focus-ring"
            />
          </Field>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {savedMessage && <p className="text-sm text-emerald-600">{savedMessage}</p>}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={() => setForm(emptyForm())}>
            Tozalash
          </Button>
          {!isEdit && (
            <Button variant="secondary" disabled={busy} onClick={() => submit(true)}>
              Saqlash va yangi
            </Button>
          )}
          <Button disabled={busy} onClick={() => submit(false)}>
            {busy ? "Saqlanmoqda…" : isEdit ? "Saqlash" : "To‘lovni yaratish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreateStudentPaymentPage() {
  return (
    <Suspense fallback={<div className="card grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <StudentPaymentForm />
    </Suspense>
  );
}
