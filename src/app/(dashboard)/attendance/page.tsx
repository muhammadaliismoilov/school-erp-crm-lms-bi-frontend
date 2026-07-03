"use client";

import { useMemo, useState } from "react";
import { CalendarDays, DoorOpen, LogOut, School, Search, Users } from "lucide-react";
import { STATUS_LABEL, STATUS_TONE } from "@/components/attendance/status-picker";
import { Badge, Spinner } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useDailyBoard, type DailyBoardRow } from "@/lib/api/attendance-daily";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-2xl font-semibold tabular-nums text-ink">{value}</div>
        <div className="text-xs text-ink-muted">{label}</div>
      </div>
    </div>
  );
}

export default function DailyAttendancePage() {
  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const board = useDailyBoard(date);

  const rows = useMemo(() => {
    const list = board.data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q) ||
        (r.className ?? "").toLowerCase().includes(q),
    );
  }, [board.data, search]);

  const summary = board.data?.summary ?? { arrived: 0, inSchool: 0, left: 0 };

  return (
    <div>
      <PageHeader
        title="Kunlik davomat (turniket)"
        subtitle="O‘quvchilarning maktabga kirish va chiqish vaqtlari."
        action={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-ink-muted" />
            <DateInput value={date} onChange={setDate} className="w-44" />
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="Keldi" value={summary.arrived} tone="bg-positive/12 text-positive" />
        <StatCard icon={School} label="Hozir maktabda" value={summary.inSchool} tone="bg-navy/10 text-navy" />
        <StatCard icon={LogOut} label="Chiqib ketgan" value={summary.left} tone="bg-caution/14 text-caution" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, kod yoki sinf bo‘yicha qidirish…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <span className="ml-auto text-xs text-ink-muted">{rows.length} ta</span>
        </div>

        {board.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : board.isError ? (
          <div className="py-16 text-center text-sm text-ink-muted">
            Ma‘lumot yuklanmadi.{" "}
            <button className="text-accent underline" onClick={() => board.refetch()}>
              Qayta urinish
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-muted">
            {board.data && board.data.rows.length > 0
              ? "Qidiruv bo‘yicha hech narsa topilmadi."
              : "Bu sanada turniketdan o‘tish qayd etilmagan."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="w-10 px-4 py-2.5 text-right">#</th>
                  <th className="px-4 py-2.5">O‘quvchi</th>
                  <th className="px-4 py-2.5">Sinf</th>
                  <th className="px-4 py-2.5">Kirdi</th>
                  <th className="px-4 py-2.5">Chiqdi</th>
                  <th className="px-4 py-2.5">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r, idx) => (
                  <DailyRow key={r.studentId} row={r} index={idx + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DailyRow({ row, index }: { row: DailyBoardRow; index: number }) {
  const inSchool = Boolean(row.checkInTime) && !row.checkOutTime;
  return (
    <tr className="hover:bg-parchment/60">
      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-ink-muted">{index}</td>
      <td className="px-4 py-2.5">
        <div className="font-medium text-ink">{row.studentName}</div>
        <div className="font-mono text-[11px] text-ink-muted">{row.studentCode}</div>
      </td>
      <td className="px-4 py-2.5 text-ink-soft">{row.className ?? "—"}</td>
      <td className="px-4 py-2.5 tabular-nums text-ink">
        {row.checkInTime ? (
          <span className="inline-flex items-center gap-1">
            <DoorOpen className="h-3.5 w-3.5 text-positive" />
            {row.checkInTime.slice(0, 5)}
          </span>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 tabular-nums text-ink">
        {row.checkOutTime ? (
          <span className="inline-flex items-center gap-1">
            <LogOut className="h-3.5 w-3.5 text-caution" />
            {row.checkOutTime.slice(0, 5)}
          </span>
        ) : inSchool ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-positive">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" /> Maktabda
          </span>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
      </td>
    </tr>
  );
}
