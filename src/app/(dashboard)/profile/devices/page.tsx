"use client";

import { useEffect, useState } from "react";
import { Copy, History, KeyRound, LogOut, Monitor, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import {
  useChangePassword,
  useDisableTwoFactor,
  useEnableTwoFactor,
  useMySessions,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessionHistory,
  useSetupTwoFactor,
  useTwoFactorStatus,
  type UserSessionInfo,
} from "@/lib/api/auth-sessions";
import { formatDateTimeDMY } from "@/lib/format";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daqiqa oldin`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}

function isMobile(deviceInfo: string | null): boolean {
  return !!deviceInfo && /iPhone|iPad|Android/i.test(deviceInfo);
}

/**
 * Qurilmalar boshqaruvi: kim ulanganini ko'rish, begona qurilmani chiqarish,
 * parolni almashtirish (boshqa qurilmalar avtomatik chiqariladi).
 */
export default function DevicesPage() {
  const { data: sessions, isLoading } = useMySessions();
  const revokeOne = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  const [revoking, setRevoking] = useState<UserSessionInfo | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const rows = sessions ?? [];
  const others = rows.filter((s) => !s.current);

  async function confirmRevokeOne() {
    if (!revoking) return;
    try {
      await revokeOne.mutateAsync(revoking.id);
      setRevoking(null);
      setToast("Qurilma chiqarildi — u bir necha soniyada uziladi");
    } catch {
      setToast("Chiqarishda xatolik");
    }
  }

  async function confirmRevokeOthers() {
    try {
      const res = await revokeOthers.mutateAsync();
      setOthersOpen(false);
      setToast(`${res.revokedCount} ta qurilma chiqarildi`);
    } catch {
      setToast("Chiqarishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Ulangan qurilmalar"
        subtitle="Hisobingizga kirgan barcha qurilmalar — begonasini darhol chiqarib yuboring"
        action={
          others.length > 0 ? (
            <Button variant="secondary" onClick={() => setOthersOpen(true)}>
              <LogOut className="mr-2 h-4 w-4 text-negative" />
              Boshqa hammasini chiqarish
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((s) => {
            const Icon = isMobile(s.deviceInfo) ? Smartphone : Monitor;
            return (
              <Card key={s.id} className={s.current ? "border-emerald-500/40 p-4" : "p-4"}>
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      s.current ? "bg-emerald-500/15 text-emerald-600" : "bg-amber/15 text-amber"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{s.deviceInfo ?? "Noma'lum qurilma"}</span>
                      {s.current && <Badge tone="positive">Hozirgi qurilma</Badge>}
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                      <p>IP: <span className="font-mono">{s.ipAddress ?? "—"}</span></p>
                      <p>Kirgan: {formatDateTimeDMY(s.createdAt)}</p>
                      <p>
                        Oxirgi faollik:{" "}
                        <span className={s.current ? "text-emerald-600" : undefined}>{relativeTime(s.lastSeenAt)}</span>
                      </p>
                    </div>
                  </div>
                  {!s.current && (
                    <Button variant="secondary" size="sm" onClick={() => setRevoking(s)}>
                      Chiqarish
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <ChangePasswordCard onDone={(n) => setToast(`Parol almashtirildi, ${n} ta boshqa qurilma chiqarildi`)} />
          <TwoFactorCard onToast={setToast} />
        </div>
        <LoginHistoryCard />
      </div>

      {/* Bitta qurilmani chiqarish tasdig'i */}
      <Modal open={!!revoking} onClose={() => setRevoking(null)} title="Qurilmani chiqarish">
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">{revoking?.deviceInfo ?? "Qurilma"}</span> (IP:{" "}
          {revoking?.ipAddress ?? "—"}) hisobingizdan chiqariladi va bir necha soniyada uziladi. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRevoking(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={revokeOne.isPending} onClick={confirmRevokeOne}>
            Chiqarish
          </Button>
        </div>
      </Modal>

      {/* Hammasini chiqarish tasdig'i */}
      <Modal open={othersOpen} onClose={() => setOthersOpen(false)} title="Boshqa hammasini chiqarish">
        <p className="text-sm text-ink-muted">
          Hozirgi qurilmangizdan tashqari <span className="font-medium text-ink">{others.length} ta qurilma</span>{" "}
          chiqariladi. Parolingizni begona bilsa,{" "}
          <span className="font-medium text-ink">avval parolni ham almashtiring</span> — aks holda qayta kirishi mumkin.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOthersOpen(false)}>Bekor qilish</Button>
          <Button variant="danger" loading={revokeOthers.isPending} onClick={confirmRevokeOthers}>
            Hammasini chiqarish
          </Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Parol almashtirish ─────────────────────────────────────────────────────

function ChangePasswordCard({ onDone }: { onDone: (revokedCount: number) => void }) {
  const changePassword = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (next.length < 8) {
      setError("Yangi parol kamida 8 belgidan iborat bo'lishi kerak");
      return;
    }
    if (next !== confirm) {
      setError("Yangi parol takrori mos kelmadi");
      return;
    }
    try {
      const res = await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      onDone(res.revokedOtherSessions);
    } catch {
      setError("Joriy parol noto'g'ri yoki yangi parol talabga javob bermaydi");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-amber" />
        <h3 className="font-display text-base font-semibold text-ink">Parolni almashtirish</h3>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        Saqlangach boshqa barcha qurilmalar avtomatik chiqariladi
      </p>
      <div className="mt-4 space-y-3">
        <Field label="Joriy parol">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Yangi parol">
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Yangi parol (takror)">
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        {error && <p className="text-sm text-negative">{error}</p>}
        <div className="flex justify-end">
          <Button
            variant="accent"
            loading={changePassword.isPending}
            disabled={!current || !next || !confirm}
            onClick={submit}
          >
            Parolni almashtirish
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Ikki bosqichli tekshiruv (2FA) ─────────────────────────────────────────

function TwoFactorCard({ onToast }: { onToast: (m: string) => void }) {
  const { data: status, isLoading } = useTwoFactorStatus();
  const setup = useSetupTwoFactor();
  const enable = useEnableTwoFactor();
  const disable = useDisableTwoFactor();

  const [pending, setPending] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const enabled = status?.enabled ?? false;

  async function startSetup() {
    setError(null);
    try {
      setPending(await setup.mutateAsync());
    } catch {
      setError("Sozlashni boshlab bo'lmadi");
    }
  }

  async function confirmEnable() {
    setError(null);
    try {
      await enable.mutateAsync(code);
      setPending(null);
      setCode("");
      onToast("2FA yoqildi — endi kirishda kod so'raladi");
    } catch {
      setError("Kod noto'g'ri — ilovadagi yangi kodni kiriting");
    }
  }

  async function confirmDisable() {
    setError(null);
    try {
      await disable.mutateAsync(disableCode);
      setDisableCode("");
      onToast("2FA o'chirildi");
    } catch {
      setError("Kod noto'g'ri");
    }
  }

  function copySecret() {
    if (!pending) return;
    navigator.clipboard?.writeText(pending.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
        ) : (
          <ShieldOff className="h-4 w-4 text-ink-muted" />
        )}
        <h3 className="font-display text-base font-semibold text-ink">Ikki bosqichli tekshiruv (2FA)</h3>
        {enabled && <Badge tone="positive">Yoqilgan</Badge>}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-6"><Spinner className="h-5 w-5" /></div>
      ) : enabled ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-ink-muted">
            Kirishda parol + Authenticator kodi so'raladi. O'chirish uchun joriy kodni kiriting.
          </p>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-32 text-center font-mono"
            />
            <Button variant="secondary" size="sm" loading={disable.isPending} disabled={disableCode.length !== 6} onClick={confirmDisable}>
              O'chirish
            </Button>
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
      ) : pending ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-ink-muted">
            1) Google Authenticator (yoki shunga o'xshash) ilovasida <span className="font-medium text-ink">"Kalitni qo'lda kiritish"</span> ni tanlang va quyidagi sirni kiriting. 2) Ilova bergan 6 raqamli kodni pastga yozing.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-parchment/40 px-3 py-2">
            <span className="min-w-0 flex-1 break-all font-mono text-sm text-ink">{pending.secret}</span>
            <button className="shrink-0 rounded-md p-1.5 text-ink-muted hover:text-ink" onClick={copySecret} title="Nusxalash">
              <Copy className="h-4 w-4" />
            </button>
            {copied && <span className="text-xs text-positive">✓</span>}
          </div>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-32 text-center font-mono"
            />
            <Button variant="accent" size="sm" loading={enable.isPending} disabled={code.length !== 6} onClick={confirmEnable}>
              Tasdiqlash va yoqish
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setPending(null); setCode(""); }}>
              Bekor
            </Button>
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-ink-muted">
            Parolingiz bilib qolinsa ham, kirish uchun telefoningizdagi bir martalik kod kerak bo'ladi — hisobingiz uchun eng kuchli himoya.
          </p>
          <Button variant="accent" size="sm" loading={setup.isPending} onClick={startSetup}>
            <ShieldCheck className="mr-1.5 h-4 w-4" /> 2FA'ni yoqish
          </Button>
          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
      )}
    </Card>
  );
}

// ─── Kirish tarixi ──────────────────────────────────────────────────────────

function LoginHistoryCard() {
  const { data: history, isLoading } = useSessionHistory();
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-amber" />
        <h3 className="font-display text-base font-semibold text-ink">Kirish tarixi</h3>
      </div>
      {isLoading ? (
        <div className="grid place-items-center py-6"><Spinner className="h-5 w-5" /></div>
      ) : (
        <ul className="mt-3 max-h-96 space-y-1.5 overflow-y-auto pr-1">
          {(history ?? []).map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs">
              <div className="min-w-0">
                <span className="font-medium text-ink">{h.deviceInfo ?? "Noma'lum"}</span>
                <span className="ml-2 font-mono text-ink-muted">{h.ipAddress ?? "—"}</span>
                <p className="mt-0.5 text-ink-muted">{formatDateTimeDMY(h.createdAt)}</p>
              </div>
              <span className="shrink-0">
                {h.current ? (
                  <Badge tone="positive">joriy</Badge>
                ) : h.revokedAt ? (
                  <Badge tone="neutral">chiqarilgan</Badge>
                ) : (
                  <Badge tone="accent">faol</Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}
