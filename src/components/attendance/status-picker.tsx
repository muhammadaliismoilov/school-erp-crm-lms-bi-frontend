"use client";

import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/api/attendance-sessions";

interface StatusOption {
  value: AttendanceStatus;
  label: string;
  /** active holatdagi rang klasslari. */
  active: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: "present", label: "Keldi", active: "bg-positive text-white border-positive" },
  { value: "late", label: "Kechikdi", active: "bg-caution text-white border-caution" },
  { value: "absent", label: "Yo‘q", active: "bg-negative text-white border-negative" },
  { value: "left_early", label: "Erta ketdi", active: "bg-amber text-white border-amber" },
  { value: "excused", label: "Sababli", active: "bg-navy text-paper border-navy" },
];

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Keldi",
  late: "Kechikdi",
  absent: "Yo‘q",
  left_early: "Erta ketdi",
  excused: "Sababli",
};

export const STATUS_TONE: Record<
  AttendanceStatus,
  "positive" | "caution" | "negative" | "accent" | "neutral"
> = {
  present: "positive",
  late: "caution",
  absent: "negative",
  left_early: "accent",
  excused: "neutral",
};

export function StatusPicker({
  value,
  onChange,
  disabled,
}: {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1" role="group" aria-label="Davomat holati">
      {STATUS_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              "focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50",
              isActive
                ? opt.active + " shadow-card"
                : "border-line bg-surface text-ink-soft hover:border-ink-muted hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
