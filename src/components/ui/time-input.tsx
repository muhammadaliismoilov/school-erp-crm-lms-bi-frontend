"use client";

import { useMemo } from "react";
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

/** Soat + Daqiqa dropdownlaridan iborat vaqt tanlagich; `HH:mm` chiqaradi. */
export function TimeInput({
  value,
  onChange,
  minuteStep = 5,
  hourLabel = "Soat",
  minuteLabel = "Daqiqa",
  disabled,
  idPrefix,
}: TimeInputProps) {
  const { hour, minute } = splitTime(value);
  const hours = useMemo(() => hourOptions().map((h) => ({ value: h, label: h })), []);
  const minutes = useMemo(
    () => minuteOptions(minuteStep).map((m) => ({ value: m, label: m })),
    [minuteStep],
  );

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-ink-muted">{hourLabel}</label>
        <Select
          id={idPrefix ? `${idPrefix}-hour` : undefined}
          value={hour}
          disabled={disabled}
          onChange={(e) => onChange(joinTime(e.target.value, minute))}
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
          onChange={(e) => onChange(joinTime(hour, e.target.value))}
          options={minutes}
          placeholder="--"
        />
      </div>
    </div>
  );
}
