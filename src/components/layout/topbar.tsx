"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/provider";
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
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-parchment/80 px-5 backdrop-blur-md lg:px-8">
      <h1 className="font-display text-xl font-bold tracking-tight text-ink">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <SchoolSwitcher />
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
