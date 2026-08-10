"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { ApiError } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

interface LoginForm {
  login: string;
  password: string;
}

export default function LoginPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const verifyTwoFactor = useAuthStore((s) => s.verifyTwoFactor);
  const status = useAuthStore((s) => s.status);
  const [serverError, setServerError] = useState<string | null>(null);
  // 2FA bosqichi: parol to'g'ri, endi authenticator kodi kutilmoqda.
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { login: "", password: "" } });

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      const res = await signIn(values.login.trim(), values.password);
      if (res.twoFactorToken) {
        setTwoFactorToken(res.twoFactorToken);
        return;
      }
      router.replace("/");
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.localized(locale) : t("auth.error"),
      );
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFactorToken || code.length !== 6) return;
    setServerError(null);
    setVerifying(true);
    try {
      await verifyTwoFactor(twoFactorToken, code);
      router.replace("/");
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.localized(locale) : "Kod noto'g'ri yoki eskirgan",
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="bg-navy-texture relative hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent font-display text-xl font-extrabold text-accent-fg">
            S
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-paper">
            School Console
          </span>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight text-paper">
            Bitta platforma — butun maktab boshqaruvi.
          </h2>
          <p className="mt-4 text-paper/55">
            Ta'lim, davomat, moliya va qabul — bitta xavfsiz tizimda.
            Istalgan xususiy maktab uchun.
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex items-center justify-center px-6 py-12">
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>
        <div className="stagger w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent font-display text-xl font-extrabold text-accent-fg">
              Y
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {t("auth.title")}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{t("auth.subtitle")}</p>

          {twoFactorToken ? (
            <form onSubmit={onVerifyCode} className="mt-8 space-y-5">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-soft">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                Ikki bosqichli tekshiruv yoqilgan — Authenticator ilovasidagi 6 raqamli kodni kiriting.
              </div>
              <Field label="Tasdiqlash kodi" htmlFor="totp">
                <Input
                  id="totp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                  className="text-center font-mono text-lg tracking-[0.4em]"
                />
              </Field>
              {serverError && (
                <p className="rounded-lg border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative">
                  {serverError}
                </p>
              )}
              <Button type="submit" variant="accent" className="w-full" loading={verifying} disabled={code.length !== 6}>
                Tasdiqlash
                {!verifying && <ArrowRight className="h-4 w-4" />}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-ink-muted hover:text-ink"
                onClick={() => {
                  setTwoFactorToken(null);
                  setCode("");
                  setServerError(null);
                }}
              >
                ← Orqaga (boshqa hisob bilan kirish)
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Field label={t("auth.login")} htmlFor="login">
              <Input
                id="login"
                autoComplete="username"
                placeholder={t("auth.loginPlaceholder")}
                {...register("login", { required: true })}
              />
            </Field>
            <Field label={t("auth.password")} htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password", { required: true })}
              />
            </Field>

            {serverError && (
              <p className="rounded-lg border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              variant="accent"
              className="w-full"
              loading={isSubmitting}
            >
              {isSubmitting ? t("auth.signingIn") : t("auth.submit")}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
          )}
        </div>
      </section>
    </main>
  );
}
