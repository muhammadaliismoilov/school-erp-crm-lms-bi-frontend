"use client";

import { CalendarClock, CheckCircle2, FileText } from "lucide-react";
import {
  planLabel,
  useStudentAgreement,
  type AgreementInstallment,
  type InstallmentState,
} from "@/lib/api/student-agreement";
import { formatMoney, formatDate } from "@/lib/utils";

const STATE: Record<InstallmentState, { label: string; chip: string; dot: string }> = {
  paid: { label: "To‘langan", chip: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500" },
  partial: { label: "Qisman", chip: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
  pending: { label: "Kutilmoqda", chip: "bg-ink-muted/10 text-ink-muted", dot: "bg-ink-muted/50" },
};

function Mini({ label, value, tone }: { label: string; value: number; tone?: "rose" | "emerald" | "ink" }) {
  const cls = tone === "rose" ? "text-rose-600" : tone === "emerald" ? "text-emerald-600" : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`font-display text-base font-semibold tnum ${cls}`}>{formatMoney(value)}</p>
    </div>
  );
}

function Row({ inst, isNext }: { inst: AgreementInstallment; isNext: boolean }) {
  const s = STATE[inst.status];
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
        isNext ? "bg-amber/10 ring-1 ring-amber/40" : "hover:bg-parchment-deep/30"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
        <span className="font-medium text-ink">{inst.seq}-to‘lov</span>
        <span className="text-ink-muted">{formatDate(inst.dueDate)}</span>
        {isNext && <span className="rounded bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Keyingi</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="tnum font-semibold text-ink">{formatMoney(inst.amount)}</span>
        <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${s.chip}`}>{s.label}</span>
      </div>
    </div>
  );
}

/** To'lov formasida o'quvchi tanlanganda kelishuvni ko'rsatadi: reja, jadval, keyingi to'lov. */
export function AgreementPanel({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentAgreement(studentId);

  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-line/40" />;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-line bg-parchment-deep/20 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <span className="font-semibold text-ink">To‘lov kelishuvi</span>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
            {planLabel(data.plan)}
          </span>
        </div>
        <span className="text-xs text-ink-muted">
          {data.installmentCount} ta to‘lov · {formatMoney(data.effectiveMonthly)}/oy tarif
        </span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <Mini label="Jami kelishuv" value={data.total} tone="ink" />
        <Mini label="To‘langan" value={data.paid} tone="emerald" />
        <Mini label="Qoldiq" value={data.remaining} tone="rose" />
      </div>

      {/* Keyingi to'lov — eng muhim */}
      {data.nextDue ? (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2.5">
          <CalendarClock className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-xs text-ink-muted">Keyingi to‘lov</p>
            <p className="font-semibold text-ink">
              {formatDate(data.nextDue.dueDate)} ·{" "}
              <span className="tnum text-amber-700">{formatMoney(data.nextDue.remaining)}</span>
            </p>
          </div>
          <span className="rounded-md bg-amber/20 px-2 py-1 text-xs font-bold text-amber-700">
            {data.nextDue.seq}-to‘lov
          </span>
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Kelishuv bo‘yicha hammasi to‘langan
        </div>
      )}

      {/* To'lov jadvali */}
      <div className="space-y-1">
        {data.installments.map((inst) => (
          <Row key={inst.seq} inst={inst} isNext={data.nextDue?.seq === inst.seq} />
        ))}
      </div>
    </div>
  );
}
