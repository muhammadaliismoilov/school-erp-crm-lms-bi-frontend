"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dmyToISO, isoToDMY, maskDMY } from "@/lib/format";
import {
  UZ_MONTHS,
  UZ_WEEKDAYS_SHORT,
  buildCalendarGrid,
  isoToUTC,
  yearRange,
} from "@/lib/calendar";

interface DatePickerProps {
  /** ISO `yyyy-mm-dd` qiymat (bo'sh bo'lsa ""). */
  value: string;
  /** To'liq, haqiqiy sana → ISO `yyyy-mm-dd`, aks holda "". */
  onChange: (iso: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Tanlash mumkin bo'lgan eng kichik/katta ISO sana (ixtiyoriy). */
  min?: string;
  max?: string;
}

/**
 * `dd/mm/yyyy` sana tanlagich: qo'lda yozish + popover kalendar (kun gridi,
 * oy/yil dropdownlari). Tashqariga doim ISO `yyyy-mm-dd` chiqaradi.
 */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "dd/mm/yyyy",
  disabled,
  className,
  min,
  max,
}: DatePickerProps) {
  const [text, setText] = useState(() => isoToDMY(value));
  const [open, setOpen] = useState(false);
  // Popover ekran o'ng chetidan chiqib ketmasligi uchun zarur bo'lsa chapga ochiladi.
  const [alignRight, setAlignRight] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  /** Ochishdan oldin joyni o'lchab, mos tomonni tanlaydi. */
  function openCalendar() {
    const POPOVER_WIDTH = 288; // w-72
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) setAlignRight(rect.left + POPOVER_WIDTH > window.innerWidth - 8);
    setOpen(true);
  }

  // Tashqi value o'zgarsa matn + ko'rinayotgan oyni moslab qo'yamiz.
  useEffect(() => {
    setText(isoToDMY(value));
    const u = isoToUTC(value);
    if (u !== null) {
      const d = new Date(u);
      setViewYear(d.getUTCFullYear());
      setViewMonth(d.getUTCMonth());
    }
  }, [value]);

  // Tashqariga bosilganda yopiladi.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const years = useMemo(() => yearRange(viewYear), [viewYear]);
  const minTs = isoToUTC(min);
  const maxTs = isoToUTC(max);
  const selectedTs = isoToUTC(value);
  const todayTs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  function handleText(raw: string) {
    const masked = maskDMY(raw);
    setText(masked);
    onChange(dmyToISO(masked) ?? "");
  }

  function pick(iso: string) {
    const ts = isoToUTC(iso);
    if (ts === null) return;
    if (minTs !== null && ts < minTs) return;
    if (maxTs !== null && ts > maxTs) return;
    onChange(iso);
    setText(isoToDMY(iso));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => handleText(e.target.value)}
        onFocus={openCalendar}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface pl-3 pr-10 text-sm text-ink",
          "placeholder:text-ink-muted/70 transition-colors",
          "focus:border-amber focus-visible:focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openCalendar())}
        aria-label="Kalendar"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink disabled:opacity-60"
      >
        <CalendarDays className="h-4 w-4" />
      </button>

      {open && !disabled && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-3 shadow-lg",
            alignRight ? "right-0" : "left-0",
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Oldingi oy"
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-parchment/60 hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              aria-label="Oy"
              className="h-8 flex-1 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
            >
              {UZ_MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              aria-label="Yil"
              className="h-8 w-20 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Keyingi oy"
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-parchment/60 hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {UZ_WEEKDAYS_SHORT.map((w) => (
              <div key={w} className="grid h-7 place-items-center text-xs font-medium text-ink-muted">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell) => {
              const ts = isoToUTC(cell.iso)!;
              const disabledCell =
                (minTs !== null && ts < minTs) || (maxTs !== null && ts > maxTs);
              const isSelected = selectedTs !== null && ts === selectedTs;
              const isToday = ts === todayTs;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={disabledCell}
                  onClick={() => pick(cell.iso)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg text-sm transition-colors",
                    !cell.inMonth && "text-ink-muted/40",
                    cell.inMonth && "text-ink",
                    !isSelected && "hover:bg-parchment/60",
                    isToday && !isSelected && "ring-1 ring-amber/50",
                    isSelected && "bg-accent text-white",
                    disabledCell && "cursor-not-allowed opacity-30 hover:bg-transparent",
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
