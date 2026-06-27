"use client";

import type { DebtsOverviewResult, MonthlyAggregate } from "@/lib/api/debts";
import { monthLabel } from "@/lib/api/debts";
import { formatMoney } from "@/lib/utils";

/** Yig'ish foizini rangli badge bilan: yuqori yashil, o'rta sariq, past qizil. */
function RateBadge({ rate }: { rate: number }) {
  const r = Math.round(rate);
  const cls = r >= 80 ? "bg-emerald-500/10 text-emerald-600" : r >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold tnum ${cls}`}>{r}%</span>;
}

function Row({ m, label, bold }: { m: MonthlyAggregate; label: string; bold?: boolean }) {
  const td = `px-4 py-3 text-right tnum ${bold ? "font-semibold text-ink" : "text-ink-muted"}`;
  return (
    <tr className={`border-b border-line/60 last:border-0 ${bold ? "bg-parchment-deep/30" : "hover:bg-parchment-deep/20"}`}>
      <td className={`px-4 py-3 text-left ${bold ? "font-semibold text-ink" : "font-medium text-ink"}`}>{label}</td>
      <td className={td}>{formatMoney(m.expected)}</td>
      <td className={`${td} !text-emerald-600`}>{formatMoney(m.collected)}</td>
      <td className={`${td} !text-rose-600`}>{formatMoney(m.remaining)}</td>
      <td className={td}>{formatMoney(m.discount)}</td>
      <td className="px-4 py-3 text-center"><RateBadge rate={m.collectionRate} /></td>
      <td className={`${td} !text-emerald-600`}>{m.fullyPaid}</td>
      <td className={`${td} !text-amber-600`}>{m.partiallyPaid}</td>
      <td className={`${td} !text-rose-600`}>{m.unpaid}</td>
    </tr>
  );
}

/** Oylik taqsimot — har oy kutilgan/yig'ilgan/qoldiq/chegirma/foiz + holat sanoqlari + Jami. */
export function MonthlyBreakdownTable({ data }: { data?: DebtsOverviewResult }) {
  const monthly = data?.monthly ?? [];
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="font-display text-lg font-semibold text-ink">Oylik taqsimot</h3>
        <p className="text-sm text-ink-muted">{data?.academic.months ?? 0} oy</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment-deep/30">
              <th className="label px-4 py-3 text-left">Oy</th>
              <th className="label px-4 py-3 text-right">Kutilgan summa</th>
              <th className="label px-4 py-3 text-right">Yig‘ilgan summa</th>
              <th className="label px-4 py-3 text-right">Qoldiq qarz</th>
              <th className="label px-4 py-3 text-right">Chegirma summa</th>
              <th className="label px-4 py-3 text-center">Yig‘ish foizi</th>
              <th className="label px-4 py-3 text-right">To‘liq to‘langan</th>
              <th className="label px-4 py-3 text-right">Qisman to‘langan</th>
              <th className="label px-4 py-3 text-right">To‘lanmagan</th>
            </tr>
          </thead>
          <tbody>
            {monthly.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-ink-muted">Ma‘lumot yo‘q</td>
              </tr>
            ) : (
              <>
                {monthly.map((m) => (
                  <Row key={`${m.year}-${m.month}`} m={m} label={monthLabel(m, true)} />
                ))}
                {data?.total && <Row m={data.total} label="Jami" bold />}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
