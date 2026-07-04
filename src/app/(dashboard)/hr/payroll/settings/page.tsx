"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Plus, Save, Trash2 } from "lucide-react";
import {
  useCreateRateCard,
  useDeleteRateCard,
  usePayrollSettings,
  useRateCards,
  useUpdatePayrollSettings,
  type PayRateCard,
} from "@/lib/api/hr-payroll-config";
import { useCreateHoliday, useDeleteHoliday, useHolidays } from "@/lib/api/hr-holidays";
import { QUALIFICATION_CATEGORIES, QUALIFICATION_LABELS, type QualificationCategory } from "@/lib/api/hr";
import { formatDateDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";

export default function PayrollSettingsPage() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="stagger">
      <Link
        href="/hr/payroll"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Oylik hisobi
      </Link>

      <PageHeader title="Oylik sozlamalari" subtitle="Stavkalar, sinf rahbarligi va ish kalendari" />

      <div className="grid gap-5 lg:grid-cols-2">
        <RateCardsSection onToast={setToast} />
        <div className="space-y-5">
          <PolicySection onToast={setToast} />
          <HolidaysSection onToast={setToast} />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Toifa stavkalari (tarixli) ────────────────────────────────────────────

function RateCardsSection({ onToast }: { onToast: (msg: string) => void }) {
  const { data: cards, isLoading } = useRateCards();
  const createCard = useCreateRateCard();
  const deleteCard = useDeleteRateCard();

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<PayRateCard | null>(null);
  const [category, setCategory] = useState<QualificationCategory>("oliy");
  const [rate, setRate] = useState<number | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Har toifaning bugungi amaldagi stavkasi (eng so'nggi effective_from ≤ bugun).
  const today = new Date().toISOString().slice(0, 10);
  const activeByCategory = new Map<QualificationCategory, PayRateCard>();
  for (const c of cards ?? []) {
    if (c.effectiveFrom > today) continue;
    const cur = activeByCategory.get(c.category);
    if (!cur || c.effectiveFrom > cur.effectiveFrom) activeByCategory.set(c.category, c);
  }

  async function submit() {
    if (rate === null || rate < 0) {
      setError("Stavkani kiriting");
      return;
    }
    if (!effectiveFrom) {
      setError("Amal qilish sanasini kiriting");
      return;
    }
    try {
      await createCard.mutateAsync({ category, ratePerLesson: rate, effectiveFrom });
      setOpen(false);
      setRate(null);
      setEffectiveFrom("");
      onToast("Stavka qo'shildi");
    } catch {
      setError("Saqlashda xatolik — bu toifa uchun shu sanada stavka bo'lishi mumkin");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteCard.mutateAsync(deleting.id);
      setDeleting(null);
      onToast("Stavka o'chirildi");
    } catch {
      onToast("O'chirishda xatolik");
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Toifa stavkalari</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Bitta dars uchun; yangi stavka yangi yozuv bilan kiritiladi — tarix saqlanadi
          </p>
        </div>
        <Button
          variant="accent"
          size="sm"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Stavka
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-10"><Spinner className="h-5 w-5" /></div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="py-2 pr-3 font-medium">Toifa</th>
              <th className="py-2 pr-3 text-right font-medium">Stavka</th>
              <th className="py-2 pr-3 font-medium">Amal qilishi</th>
              <th className="py-2 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(cards ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-ink-muted">
                  Stavkalar kiritilmagan — o'qituvchi darslari shaxsiy stavka bilan hisoblanadi
                </td>
              </tr>
            ) : (
              (cards ?? []).map((c) => {
                const isActive = activeByCategory.get(c.category)?.id === c.id;
                return (
                  <tr key={c.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5 pr-3 text-ink">{QUALIFICATION_LABELS[c.category]}</td>
                    <td className="tnum py-2.5 pr-3 text-right font-medium text-ink">
                      {formatMoney(c.ratePerLesson)}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-soft">
                      <span className="mr-2">{formatDateDMY(c.effectiveFrom)}</span>
                      {isActive && <Badge tone="positive">amalda</Badge>}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                        title="O'chirish"
                        onClick={() => setDeleting(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi stavka">
        <div className="space-y-4">
          <Field label="Toifa">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as QualificationCategory)}
              options={QUALIFICATION_CATEGORIES.map((c) => ({ value: c, label: QUALIFICATION_LABELS[c] }))}
            />
          </Field>
          <Field label="Dars stavkasi (so'm)">
            <NumberInput value={rate} onChange={setRate} placeholder="60 000" />
          </Field>
          <Field label="Shu sanadan amal qiladi">
            <DatePicker value={effectiveFrom} onChange={setEffectiveFrom} />
          </Field>
          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button>
          <Button variant="accent" loading={createCard.isPending} onClick={submit}>Saqlash</Button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Stavkani o'chirish">
        <p className="text-sm text-ink-muted">
          {deleting && `${QUALIFICATION_LABELS[deleting.category]} — ${formatMoney(deleting.ratePerLesson)} (${formatDateDMY(deleting.effectiveFrom)})`}{" "}
          o'chiriladi. Avval hisoblangan oyliklar o'zgarmaydi (snapshot). Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteCard.isPending} onClick={confirmDelete}>O'chirish</Button>
        </div>
      </Modal>
    </Card>
  );
}

// ─── Sinf rahbarligi siyosati ──────────────────────────────────────────────

function PolicySection({ onToast }: { onToast: (msg: string) => void }) {
  const { data: settings, isLoading } = usePayrollSettings();
  const update = useUpdatePayrollSettings();
  const [rate, setRate] = useState<number | null>(null);
  const [maxCount, setMaxCount] = useState<number | null>(null);

  useEffect(() => {
    if (!settings) return;
    setRate(settings.classLeaderRate);
    setMaxCount(settings.maxClassLeaderships);
  }, [settings]);

  async function save() {
    try {
      await update.mutateAsync({
        classLeaderRate: rate ?? 0,
        maxClassLeaderships: maxCount ?? 3,
      });
      onToast("Siyosat saqlandi");
    } catch {
      onToast("Saqlashda xatolik");
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-semibold text-ink">Sinf rahbarligi</h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        Oy o'rtasida almashsa har o'qituvchiga kunlab proporsional to'lanadi
      </p>
      {isLoading ? (
        <div className="grid place-items-center py-8"><Spinner className="h-5 w-5" /></div>
      ) : (
        <div className="mt-4 space-y-4">
          <Field label="Bitta sinf uchun oylik qo'shimcha (so'm)">
            <NumberInput value={rate} onChange={setRate} placeholder="600 000" />
          </Field>
          <Field label="Bir o'qituvchiga maksimal sinflar soni">
            <NumberInput value={maxCount} onChange={setMaxCount} placeholder="3" />
          </Field>
          <div className="flex justify-end">
            <Button variant="accent" size="sm" loading={update.isPending} onClick={save}>
              <Save className="mr-1.5 h-4 w-4" /> Saqlash
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Ish kalendari (bayramlar) ─────────────────────────────────────────────

function HolidaysSection({ onToast }: { onToast: (msg: string) => void }) {
  const year = String(new Date().getFullYear());
  const { data: holidays, isLoading } = useHolidays(`${year}-01-01`, `${year}-12-31`);
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const [date, setDate] = useState("");
  const [name, setName] = useState("");

  async function add() {
    if (!date || !name.trim()) return;
    try {
      await createHoliday.mutateAsync({ date, name: name.trim() });
      setDate("");
      setName("");
      onToast("Bayram qo'shildi");
    } catch {
      onToast("Bu sana allaqachon kiritilgan");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-amber" />
        <h2 className="font-display text-base font-semibold text-ink">Ish kalendari — {year}</h2>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">
        Yakshanba avtomatik dam olish kuni; bayramlar okladning kunlik stavkasiga ta'sir qiladi
      </p>

      <div className="mt-4 flex gap-2">
        <DatePicker value={date} onChange={setDate} />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bayram nomi" />
        <Button variant="secondary" loading={createHoliday.isPending} onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8"><Spinner className="h-5 w-5" /></div>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {(holidays ?? []).length === 0 ? (
            <li className="py-4 text-center text-sm text-ink-muted">Bayramlar kiritilmagan</li>
          ) : (
            (holidays ?? []).map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <span className="text-ink">
                  <span className="tnum mr-3 text-ink-muted">{formatDateDMY(h.date)}</span>
                  {h.name}
                </span>
                <button
                  className="rounded-md p-1 text-rose-500 hover:bg-rose-500/10"
                  title="O'chirish"
                  onClick={() => deleteHoliday.mutate(h.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}
