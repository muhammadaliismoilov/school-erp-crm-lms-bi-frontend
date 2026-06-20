import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-rose-500/15 text-rose-600",
  "bg-amber-500/15 text-amber-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-sky-500/15 text-sky-600",
  "bg-violet-500/15 text-violet-600",
  "bg-fuchsia-500/15 text-fuchsia-600",
  "bg-cyan-500/15 text-cyan-600",
  "bg-orange-500/15 text-orange-600",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface Props {
  name: string;
  seed?: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

/** Deterministik rangli avatar (rasm bo‘lsa rasm, aks holda bosh harflar). */
export function StudentAvatar({ name, seed, photoUrl, size = "md", className }: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        SIZES[size],
        colorFor(seed ?? name),
        className,
      )}
    >
      {initials}
    </span>
  );
}
