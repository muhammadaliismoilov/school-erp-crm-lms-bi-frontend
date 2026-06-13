"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { setAuthFailureHandler } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "@/lib/theme/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const hydrate = useAuthStore((s) => s.hydrate);
  const forceSignOut = useAuthStore((s) => s.forceSignOut);
  const wired = useRef(false);

  useEffect(() => {
    if (wired.current) return;
    wired.current = true;
    setAuthFailureHandler(() => forceSignOut());
    hydrate();
  }, [hydrate, forceSignOut]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
