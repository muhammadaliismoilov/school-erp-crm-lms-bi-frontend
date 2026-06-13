"use client";

import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALES } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium text-ink-soft hover:border-ink-muted"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              onMouseDown={() => {
                setLocale(code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-parchment",
                code === locale ? "text-ink" : "text-ink-soft",
              )}
            >
              {label}
              {code === locale && <Check className="h-4 w-4 text-amber" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
