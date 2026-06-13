"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { dmyToISO, isoToDMY, maskDMY } from "@/lib/format";

interface DateInputProps {
  /** ISO `yyyy-mm-dd` qiymat (bo'sh bo'lsa ""). */
  value: string;
  /** To'liq, haqiqiy sana yozilganda ISO `yyyy-mm-dd`, aks holda "". */
  onChange: (iso: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: string; // ISO
  max?: string; // ISO
}

/**
 * `dd/mm/yyyy` ko'rinishidagi sana inputi — native locale (mm/dd/yyyy) muammosini
 * hal qiladi. Foydalanuvchi qo'lda yozadi yoki kalendar tugmasidan tanlaydi;
 * tashqariga doim ISO `yyyy-mm-dd` chiqadi.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(
    { value, onChange, id, placeholder = "dd/mm/yyyy", disabled, className, min, max },
    ref,
  ) {
    const [text, setText] = useState(() => isoToDMY(value));
    const pickerRef = useRef<HTMLInputElement>(null);

    // Tashqi value o'zgarsa (reset/edit) matnni moslab qo'yamiz.
    useEffect(() => {
      setText(isoToDMY(value));
    }, [value]);

    function handleText(raw: string) {
      const masked = maskDMY(raw);
      setText(masked);
      onChange(dmyToISO(masked) ?? "");
    }

    function openPicker() {
      const el = pickerRef.current;
      if (!el || disabled) return;
      if (typeof el.showPicker === "function") el.showPicker();
      else el.focus();
    }

    return (
      <div className={cn("relative", className)}>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => handleText(e.target.value)}
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
          onClick={openPicker}
          disabled={disabled}
          aria-label="Kalendardan tanlash"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink disabled:opacity-60"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        {/* Kalendar tanlovi uchun yashirin native input (qiymat ISO). */}
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => {
            const iso = e.target.value;
            setText(isoToDMY(iso));
            onChange(iso);
          }}
          className="pointer-events-none absolute right-2 top-1/2 h-0 w-0 -translate-y-1/2 opacity-0"
        />
      </div>
    );
  },
);
