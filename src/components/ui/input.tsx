import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink",
      "placeholder:text-ink-muted/70 transition-colors",
      "focus:border-amber focus-visible:focus-ring",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="label block">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
