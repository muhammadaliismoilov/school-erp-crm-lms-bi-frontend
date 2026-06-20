import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "accent" | "sky" | "rose" | "amber" | "violet";
  hint?: string;
  className?: string;
}

const TONES = {
  accent: "bg-accent/12 text-accent",
  sky: "bg-sky-500/12 text-sky-600",
  rose: "bg-rose-500/12 text-rose-600",
  amber: "bg-amber-500/12 text-amber-600",
  violet: "bg-violet-500/12 text-violet-600",
};

/** Sahifa yuqorisidagi statistika kartasi (ikona + son + izoh). */
export function StatCard({ label, value, icon, tone = "accent", hint, className }: Props) {
  return (
    <div className={cn("card flex items-center gap-3 p-4", className)}>
      {icon && (
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", TONES[tone])}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-display text-2xl font-semibold leading-tight text-ink tnum">{value}</p>
        <p className="truncate text-sm text-ink-muted">{label}</p>
        {hint && <p className="text-xs text-ink-muted/70">{hint}</p>}
      </div>
    </div>
  );
}
