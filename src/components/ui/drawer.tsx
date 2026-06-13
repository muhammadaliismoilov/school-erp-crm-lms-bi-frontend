"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Sticky footer area (e.g. Cancel / Save buttons). */
  footer?: React.ReactNode;
  icon?: React.ReactNode;
}

/** Right-side slide-over panel. Same contract as Modal, anchored to the edge. */
export function Drawer({ open, onClose, title, subtitle, children, footer, icon }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                {icon}
              </span>
            )}
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-parchment hover:text-ink focus-visible:focus-ring"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className={cn("flex-1 overflow-y-auto px-6 py-5")}>{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
