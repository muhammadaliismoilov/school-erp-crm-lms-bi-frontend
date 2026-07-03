"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme } from "@/lib/theme/provider";
import { initials } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { SchoolSwitcher } from "./school-switcher";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      title={dark ? "Kunduzgi rejim" : "Qorong‘i rejim"}
      aria-label="Mavzuni almashtirish"
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:border-accent hover:text-accent"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function Topbar({ title }: { title: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-parchment/80 px-5 backdrop-blur-md lg:px-8">
      <h1 className="font-display text-xl font-bold tracking-tight text-ink">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <SchoolSwitcher />
        <ThemeToggle />
        <LanguageSwitcher />
        <Link
          href="/profile"
          title="Mening profilim"
          className="hidden items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-parchment sm:flex"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-semibold text-paper">
            {initials(user?.username, user?.roles?.[0])}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-ink">{user?.username}</p>
            <p className="text-[11px] text-ink-muted">{user?.roles?.[0]}</p>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          title={t("nav.logout")}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-soft hover:border-negative hover:text-negative"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
