import { Construction } from "lucide-react";

export function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="card grid place-items-center gap-2 py-20 text-center">
      <Construction className="h-8 w-8 text-ink-muted/60" />
      <p className="font-medium text-ink">{title}</p>
      <p className="text-sm text-ink-muted">Bu bo‘lim tez orada qo‘shiladi</p>
    </div>
  );
}
