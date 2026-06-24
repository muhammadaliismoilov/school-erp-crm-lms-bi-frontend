"use client";

import { cn } from "@/lib/utils";
import type { RatingLeader } from "@/lib/api/students-rating";

interface Props {
  podium: RatingLeader[];
  onSelect?: (studentId: string) => void;
}

/** Pog'ona balandligi va ranglari (1-o'rin markazda, eng baland). */
const SLOTS: Record<number, { order: string; height: string; block: string; avatar: string; rank: string; podium: string }> = {
  1: {
    order: "order-2",
    height: "h-28",
    block: "bg-gradient-to-b from-amber/25 to-amber/5 border-amber/40",
    avatar: "bg-amber/20 text-amber ring-2 ring-amber/50",
    rank: "bg-amber text-white",
    podium: "from-amber/30 to-amber/10 text-amber",
  },
  2: {
    order: "order-1",
    height: "h-20",
    block: "bg-parchment/70 border-line",
    avatar: "bg-slate-400/15 text-slate-500 ring-2 ring-slate-400/40",
    rank: "bg-slate-400 text-white",
    podium: "from-slate-400/20 to-slate-400/5 text-slate-500",
  },
  3: {
    order: "order-3",
    height: "h-16",
    block: "bg-parchment/70 border-line",
    avatar: "bg-orange-700/15 text-orange-700 ring-2 ring-orange-700/40",
    rank: "bg-orange-700 text-white",
    podium: "from-orange-700/20 to-orange-700/5 text-orange-700",
  },
};

export function RatingPodium({ podium, onSelect }: Props) {
  if (podium.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-muted">Ma'lumot yo'q</p>;
  }

  return (
    <div className="flex items-end justify-center gap-4 px-2 py-4 sm:gap-8">
      {podium.map((leader) => {
        const slot = SLOTS[leader.rank] ?? SLOTS[3];
        return (
          <button
            key={leader.studentId}
            type="button"
            onClick={() => onSelect?.(leader.studentId)}
            className={cn("group flex w-24 flex-col items-center sm:w-32", slot.order)}
          >
            {/* Rank rozetka */}
            <span className={cn("mb-1 grid h-6 w-6 place-items-center rounded-full text-xs font-semibold tnum", slot.rank)}>
              {String(leader.rank).padStart(2, "0")}
            </span>
            {/* Avatar */}
            <span className={cn("grid h-12 w-12 place-items-center rounded-xl text-sm font-semibold transition-transform group-hover:scale-105", slot.avatar)}>
              {leader.initials ?? "—"}
            </span>
            <p className="mt-2 line-clamp-1 text-center text-sm font-medium text-ink">{leader.studentName}</p>
            <p className="text-xs text-ink-muted">{leader.classLabel ?? "—"}</p>
            <p className={cn("font-display text-lg font-semibold tnum", slot.podium.split(" ").pop())}>
              {leader.umumiyBall}
            </p>
            {/* Pog'ona bloki */}
            <div className={cn("mt-1 grid w-full place-items-center rounded-t-xl border bg-gradient-to-b font-display text-3xl font-bold tnum", slot.height, slot.block, slot.podium)}>
              {leader.rank}
            </div>
          </button>
        );
      })}
    </div>
  );
}
