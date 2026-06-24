"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Paperclip, UploadCloud, X } from "lucide-react";
import {
  useCreateTransaction,
  useTransaction,
  useTransactionOptions,
  useUpdateTransaction,
  MONTH_LABELS,
  type CategoryOption,
  type TransactionInput,
  type TransactionType,
} from "@/lib/api/transactions";
import { useClassList } from "@/lib/api/classes";
import { useStudents } from "@/lib/api/students";
import { useUsers } from "@/lib/api/users";
import { useUploadFile } from "@/lib/api/files";
import { useAuthStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { PageHeader } from "@/components/ui/page-header";

const MAX_RECEIPT_SIZE = 10 * 1024 * 1024; // 10 MB — rasmga mos.

const MONTH_OPTIONS = MONTH_LABELS.map((m, i) => ({ value: String(i + 1), label: m }));

interface FormState {
  type: TransactionType;
  purposeCategoryId: string;
  amount: number | null;
  paymentTypeId: string;
  personId: string;
  month: string;
  note: string;
  receiptFileId: string | null;
  receiptName: string | null;
  // boyitilgan o'quvchi-to'lov varianti
  classId: string;
  studentId: string;
  discountPercent: number | null;
  price: number | null;
}

const emptyForm = (): FormState => ({
  type: "income",
  purposeCategoryId: "",
  amount: null,
  paymentTypeId: "",
  personId: "",
  month: String(new Date().getMonth() + 1),
  note: "",
  receiptFileId: null,
  receiptName: null,
  classId: "",
  studentId: "",
  discountPercent: null,
  price: null,
});

function TransactionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const isEdit = !!editId;

  const can = useAuthStore((s) => s.can);
  const canManage = can("finance.manage");

  const { data: options } = useTransactionOptions();
  const { data: usersData } = useUsers({ page: 1, limit: 100 });
  const { data: classesData } = useClassList();
  const { data: existing } = useTransaction(editId);
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const upload = useUploadFile();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Tahrirlash rejimida mavjud yozuvni formaga yuklash.
  useEffect(() => {
    if (!existing) return;
    setForm({
      type: existing.type,
      purposeCategoryId: existing.purposeCategoryId ?? "",
      amount: existing.amount,
      paymentTypeId: existing.paymentTypeId ?? "",
      personId: existing.personId ?? "",
      month: existing.month ? String(existing.month) : String(new Date().getMonth() + 1),
      note: existing.note ?? "",
      receiptFileId: existing.receiptFileId ?? null,
      receiptName: existing.receiptFileId ? "Biriktirilgan fayl" : null,
      classId: existing.classId ?? "",
      studentId: existing.studentId ?? "",
      discountPercent: existing.discountPercent ?? null,
      price: existing.price ?? null,
    });
  }, [existing]);

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
    setError(null);
    setSavedMessage(null);
  }

  // Tanlangan tur (kirim/chiqim) bo'yicha mos kategoriyalar.
  const categoryOptions = useMemo(() => {
    const list = (options?.categories ?? []).filter((c) => c.kind === "both" || c.kind === form.type);
    return [{ value: "", label: "To‘lov maqsadini tanlang" }, ...list.map((c) => ({ value: c.id, label: c.name }))];
  }, [options, form.type]);

  const selectedCategory: CategoryOption | undefined = useMemo(
    () => options?.categories.find((c) => c.id === form.purposeCategoryId),
    [options, form.purposeCategoryId],
  );
  const isStudentTuition = !!selectedCategory?.isStudentTuition;

  const paymentTypeOptions = useMemo(
    () => [
      { value: "", label: "To‘lov turini tanlang" },
      ...(options?.paymentTypes ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [options],
  );
  const personOptions = useMemo(
    () => [
      { value: "", label: "Shaxsni tanlang" },
      ...(usersData?.items ?? []).map((u) => {
        const role = u.roles?.[0]?.name;
        return { value: u.id, label: `${u.lastName} ${u.firstName}`.trim() + (role ? ` — ${role}` : "") };
      }),
    ],
    [usersData],
  );
  const classOptions = useMemo(
    () => [{ value: "", label: "Sinfni tanlang" }, ...(classesData?.items ?? []).map((c) => ({ value: c.id, label: c.name }))],
    [classesData],
  );

  const { data: studentsData } = useStudents({ page: 1, limit: 100, classId: form.classId || undefined });
  const studentOptions = useMemo(
    () => [
      { value: "", label: "O‘quvchini tanlang" },
      ...(studentsData?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}`.trim() })),
    ],
    [studentsData],
  );

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_RECEIPT_SIZE) {
      setError("Fayl hajmi 10 MB dan oshmasligi kerak");
      return;
    }
    try {
      const uploaded = await upload.mutateAsync(file);
      patch({ receiptFileId: uploaded.id, receiptName: uploaded.fileName });
    } catch {
      setError("Faylni yuklashda xatolik yuz berdi");
    }
  }

  function buildPayload(): TransactionInput | null {
    if (!form.amount || form.amount <= 0) {
      setError("Miqdor 0 dan katta bo‘lishi kerak");
      return null;
    }
    if (isStudentTuition && !form.studentId) {
      setError("O‘quvchi to‘lovi uchun o‘quvchini tanlang");
      return null;
    }
    return {
      type: form.type,
      amount: form.amount,
      purposeCategoryId: form.purposeCategoryId || undefined,
      paymentTypeId: form.paymentTypeId || undefined,
      personId: form.personId || undefined,
      month: form.month ? Number(form.month) : undefined,
      note: form.note.trim() || undefined,
      receiptFileId: form.receiptFileId || undefined,
      classId: isStudentTuition ? form.classId || undefined : undefined,
      studentId: isStudentTuition ? form.studentId || undefined : undefined,
      discountPercent: isStudentTuition ? form.discountPercent ?? undefined : undefined,
      price: isStudentTuition ? form.price ?? undefined : undefined,
    };
  }

  async function submit(stayOnPage: boolean) {
    const payload = buildPayload();
    if (!payload) return;
    try {
      if (isEdit && editId) {
        await updateTx.mutateAsync({ id: editId, input: payload });
        router.push("/finance/transactions");
        return;
      }
      await createTx.mutateAsync(payload);
      if (stayOnPage) {
        setForm((prev) => ({ ...emptyForm(), type: prev.type }));
        setSavedMessage("Tranzaksiya saqlandi. Yangisini kiriting.");
      } else {
        router.push("/finance/transactions");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const busy = createTx.isPending || updateTx.isPending;
  const submitLabel = form.type === "income" ? "Kirimni yaratish" : "Chiqimni yaratish";

  if (!canManage) {
    return (
      <div className="card p-8 text-center text-ink-muted">Ushbu amal uchun ruxsatingiz yo‘q.</div>
    );
  }

  return (
    <div className="stagger">
      <button
        onClick={() => router.push("/finance/transactions")}
        className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Tranzaksiyalar
      </button>
      <PageHeader
        title={isEdit ? "Tranzaksiyani tahrirlash" : "Tranzaksiyalar"}
        subtitle="Kirim va chiqim tranzaksiyalarini yaratish"
      />

      {/* Kirim / Chiqim toggle */}
      <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-line">
        {(["income", "expense"] as TransactionType[]).map((t) => {
          const active = form.type === t;
          return (
            <button
              key={t}
              onClick={() => patch({ type: t, purposeCategoryId: "" })}
              className={`py-3 text-sm font-semibold transition-colors ${
                active
                  ? t === "income"
                    ? "bg-emerald-500 text-white"
                    : "bg-accent text-accent-fg"
                  : "bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {t === "income" ? "Kirim" : "Chiqim"}
            </button>
          );
        })}
      </div>

      <div className="card space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="To‘lov maqsadi">
            <Select
              options={categoryOptions}
              value={form.purposeCategoryId}
              placeholder="To‘lov maqsadini tanlang"
              onChange={(e) => patch({ purposeCategoryId: e.target.value })}
            />
          </Field>
          <Field label="Miqdor">
            <NumberInput value={form.amount} onChange={(v) => patch({ amount: v })} placeholder="Miqdorni kiriting" />
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

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Shaxs">
            <Select
              options={personOptions}
              value={form.personId}
              placeholder="Shaxsni tanlang"
              onChange={(e) => patch({ personId: e.target.value })}
            />
          </Field>
          <Field label="Oylar">
            <Select options={MONTH_OPTIONS} value={form.month} onChange={(e) => patch({ month: e.target.value })} />
          </Field>
        </div>

        {/* Boyitilgan o'quvchi-to'lov varianti */}
        {isStudentTuition && (
          <div className="grid gap-4 rounded-xl border border-dashed border-line p-4 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Sinf">
              <Select
                options={classOptions}
                value={form.classId}
                placeholder="Sinfni tanlang"
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
            <Field label="Chegirma (%)">
              <NumberInput value={form.discountPercent} onChange={(v) => patch({ discountPercent: v })} decimal placeholder="0" />
            </Field>
            <Field label="To‘lov narxi">
              <NumberInput value={form.price} onChange={(v) => patch({ price: v })} placeholder="Asl narx" />
            </Field>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Izoh (ixtiyoriy)">
            <textarea
              value={form.note}
              onChange={(e) => patch({ note: e.target.value })}
              rows={3}
              placeholder="Izoh kiriting"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus:border-amber focus-visible:focus-ring"
            />
          </Field>
          <Field label="To‘lov cheki (ixtiyoriy)">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line py-6 text-center text-sm text-ink-muted hover:border-amber">
              {upload.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : form.receiptName ? (
                <span className="inline-flex items-center gap-1 text-ink">
                  <Paperclip className="h-4 w-4" /> {form.receiptName}
                </span>
              ) : (
                <>
                  <UploadCloud className="h-6 w-6" />
                  <span>Fayllarni tanlash uchun bosing</span>
                  <span className="text-xs text-ink-muted/70">Hajmi 10 MB gacha</span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0])}
              />
            </label>
            {form.receiptName && (
              <button
                className="mt-1 inline-flex items-center gap-1 text-xs text-rose-500"
                onClick={() => patch({ receiptFileId: null, receiptName: null })}
              >
                <X className="h-3 w-3" /> Olib tashlash
              </button>
            )}
          </Field>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {savedMessage && <p className="text-sm text-emerald-600">{savedMessage}</p>}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={() => setForm((prev) => ({ ...emptyForm(), type: prev.type }))}>
            Tozalash
          </Button>
          {!isEdit && (
            <Button variant="secondary" disabled={busy} onClick={() => submit(true)}>
              Saqlash va yangi
            </Button>
          )}
          <Button disabled={busy} onClick={() => submit(false)}>
            {busy ? "Saqlanmoqda…" : isEdit ? "Saqlash" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreateTransactionPage() {
  return (
    <Suspense fallback={<div className="card grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <TransactionForm />
    </Suspense>
  );
}
