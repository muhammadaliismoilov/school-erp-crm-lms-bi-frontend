"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import {
  NAV_ITEMS,
  isGroup,
  type NavGroup,
  type NavLeaf,
} from "@/lib/nav";
import { cn, initials } from "@/lib/utils";

function isLeafActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLeafLink({
  item,
  nested = false,
}: {
  item: NavLeaf;
  nested?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const active = isLeafActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
        nested ? "px-3 py-2 text-[13px]" : "px-3 py-2.5",
        active
          ? "bg-paper/12 text-paper"
          : "text-paper/55 hover:bg-paper/8 hover:text-paper",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
      )}
      <Icon className={cn(nested ? "h-4 w-4" : "h-[18px] w-[18px]")} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

function NavGroupItem({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const Icon = group.icon;

  const childActive = group.children.some((c) =>
    isLeafActive(pathname, c.href),
  );
  const [open, setOpen] = useState(childActive);
  const expanded = open || childActive;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          childActive
            ? "text-paper"
            : "text-paper/55 hover:bg-paper/8 hover:text-paper",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="flex-1 text-left">{t(group.labelKey)}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            expanded ? "rotate-180" : "",
          )}
        />
      </button>
      {expanded && (
        <div className="mt-0.5 flex flex-col gap-0.5 border-l border-paper/10 pl-3">
          {group.children
            .filter((c) => can(c.permission))
            .map((c) => (
              <NavLeafLink key={c.href} item={c} nested />
            ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { t } = useI18n();
  const router = useRouter();
  const can = useAuthStore((s) => s.can);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const visible = NAV_ITEMS.filter((entry) => can(entry.permission));

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="bg-navy-texture sticky top-0 hidden h-screen w-64 shrink-0 flex-col px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent font-display text-xl font-extrabold text-accent-fg">
          S
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight text-paper">
            School
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/45">
            console
          </p>
        </div>
      </div>

      <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/35">
        {t("nav.overview")}
      </p>
      <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {visible.map((entry) =>
          isGroup(entry) ? (
            <NavGroupItem key={entry.id} group={entry} />
          ) : (
            <NavLeafLink key={entry.href} item={entry} />
          ),
        )}
      </nav>

      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-paper/10 bg-paper/[0.04] px-2 py-2">
        <Link
          href="/profile"
          title="Mening profilim"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-paper/8"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
            {initials(user?.username, user?.roles?.[0])}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-paper">
              {user?.username}
            </p>
            <p className="truncate text-[11px] text-paper/45">
              {user?.roles?.[0]}
            </p>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          title={t("nav.logout")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-paper/50 transition-colors hover:bg-paper/8 hover:text-negative"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
