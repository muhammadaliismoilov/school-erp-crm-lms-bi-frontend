"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { hourOptions, joinTime, minuteOptions, splitTime } from "@/lib/time";

interface TimeInputProps {
  /** `HH:mm` qiymat (bo'sh bo'lsa ""). */
  value: string;
  /** To'liq `HH:mm`, aks holda "". */
  onChange: (value: string) => void;
  /** Daqiqa qadami (default 5). */
  minuteStep?: number;
  hourLabel?: string;
  minuteLabel?: string;
  disabled?: boolean;
  idPrefix?: string;
}

/**
 * Soat + Daqiqa dropdownlaridan iborat vaqt tanlagich; `HH:mm` chiqaradi.
 *
 * Soat/daqiqa qismlari ichki state'da alohida saqlanadi — shunda bitta qismni
 * tanlash (masalan faqat soat) ikkinchisi bo'sh bo'lsa ham yo'qolmaydi.
 */
export function TimeInput({
  value,
  onChange,
  minuteStep = 5,
  hourLabel = "Soat",
  minuteLabel = "Daqiqa",
  disabled,
  idPrefix,
}: TimeInputProps) {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");

  // Tashqi value o'zgarsa qismlarni moslaymiz (faqat haqiqatan farq qilsa,
  // qisman kiritmani buzmaslik uchun).
  useEffect(() => {
    const parts = splitTime(value);
    if (joinTime(hour, minute) !== value) {
      setHour(parts.hour);
      setMinute(parts.minute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const hours = useMemo(() => hourOptions().map((h) => ({ value: h, label: h })), []);
  const minutes = useMemo(
    () => minuteOptions(minuteStep).map((m) => ({ value: m, label: m })),
    [minuteStep],
  );

  function commit(nextHour: string, nextMinute: string) {
    setHour(nextHour);
    setMinute(nextMinute);
    onChange(joinTime(nextHour, nextMinute));
  }

  // Picking one part while the other is empty auto-fills the counterpart to
  // "00" so a complete HH:mm forms immediately (visible + saved). Clearing a
  // part (value "") never forces the other.
  const onHour = (next: string) => commit(next, next && !minute ? "00" : minute);
  const onMinute = (next: string) => commit(next && !hour ? "00" : hour, next);

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-ink-muted">{hourLabel}</label>
        <Select
          id={idPrefix ? `${idPrefix}-hour` : undefined}
          value={hour}
          disabled={disabled}
          onChange={(e) => onHour(e.target.value)}
          options={hours}
          placeholder="--"
        />
      </div>
      <span className="pb-2.5 text-ink-muted">:</span>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-ink-muted">{minuteLabel}</label>
        <Select
          id={idPrefix ? `${idPrefix}-minute` : undefined}
          value={minute}
          disabled={disabled}
          onChange={(e) => onMinute(e.target.value)}
          options={minutes}
          placeholder="--"
        />
      </div>
    </div>
  );
}
