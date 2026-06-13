"use client";

import { forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatNumberSpaced, maskNumber, toNumber } from "@/lib/format";

interface NumberInputProps {
  /** Raqamli qiymat (bo'sh bo'lsa null yoki ""). */
  value: number | string | null | undefined;
  /** Toza son qaytadi (bo'shliqsiz); bo'sh bo'lsa null. */
  onChange: (value: number | null) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Kasr (masalan baho 4.5, foiz) ruxsat etilsinmi. Default: false (butun). */
  decimal?: boolean;
}

/**
 * Mingliklarni live ravishda bo'shliq bilan ko'rsatadigan son inputi:
 * yozganda `100 000` ko'rinadi, tashqariga toza son (`100000`) chiqadi.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    { value, onChange, id, placeholder, disabled, className, decimal = false },
    ref,
  ) {
    const [text, setText] = useState(() =>
      value === null || value === undefined || value === ""
        ? ""
        : formatNumberSpaced(value),
    );

    // Tashqi value dasturiy o'zgarsa matnni moslaymiz (joriy fokus kiritmasini buzmay).
    useEffect(() => {
      const incoming =
        value === null || value === undefined || value === ""
          ? ""
          : formatNumberSpaced(value);
      setText((prev) => (toNumber(prev) === toNumber(incoming) ? prev : incoming));
    }, [value]);

    function handle(raw: string) {
      const masked = maskNumber(raw, decimal);
      setText(masked);
      onChange(toNumber(masked));
    }

    return (
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => handle(e.target.value)}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink",
          "placeholder:text-ink-muted/70 transition-colors",
          "focus:border-amber focus-visible:focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      />
    );
  },
);
