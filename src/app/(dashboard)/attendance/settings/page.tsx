"use client";

import { useEffect, useState } from "react";
import { BellRing, Clock, Moon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { PageHeader } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { TimeInput } from "@/components/ui/time-input";
import {
  useAttendanceSettings,
  useUpdateAttendanceSettings,
  type AttendanceSettings,
} from "@/lib/api/attendance-settings";

const EMPTY: AttendanceSettings = {
  lateThresholdMinutes: 5,
  correctionWindowMinutes: 720,
  notifyOnEntry: true,
  notifyOnExit: true,
  notifyOnSession: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof BellRing;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-parchment-deep/60 text-ink-soft">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          {description && <p className="text-xs text-ink-muted">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-ink-muted">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

export default function AttendanceSettingsPage() {
  const settings = useAttendanceSettings();
  const update = useUpdateAttendanceSettings();

  const [form, setForm] = useState<AttendanceSettings>(EMPTY);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  function set<K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    update.mutate(
      {
        ...form,
        quietHoursStart: form.quietHoursStart || null,
        quietHoursEnd: form.quietHoursEnd || null,
      },
      {
        onSuccess: () => setToast("Sozlamalar saqlandi ✓"),
        onError: () => setToast("Saqlab bo‘lmadi"),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Davomat sozlamalari"
        subtitle="Kechikish chegarasi, tuzatish oynasi va notifikatsiya qoidalari."
        action={
          <Button onClick={save} loading={update.isPending} disabled={settings.isLoading}>
            <Save className="h-4 w-4" /> Saqlash
          </Button>
        }
      />

      {settings.isLoading ? (
        <div className="card flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="grid max-w-3xl gap-4">
          <Section icon={Clock} title="Belgilash qoidalari">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-ink">Kechikish chegarasi</div>
                <div className="text-xs text-ink-muted">
                  Dars boshidan shu daqiqadan keyin kelgan “kechikdi” hisoblanadi.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={form.lateThresholdMinutes}
                  onChange={(v) => set("lateThresholdMinutes", v ?? 0)}
                  className="w-24"
                />
                <span className="text-sm text-ink-muted">daqiqa</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-ink">Tuzatish oynasi</div>
                <div className="text-xs text-ink-muted">
                  Tasdiqdan keyin o‘qituvchi shu vaqt ichida tuzata oladi (0 = faqat admin).
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={form.correctionWindowMinutes}
                  onChange={(v) => set("correctionWindowMinutes", v ?? 0)}
                  className="w-28"
                />
                <span className="text-sm text-ink-muted">daqiqa</span>
              </div>
            </div>
          </Section>

          <Section icon={BellRing} title="Ota-onaga notifikatsiya" description="Qaysi hodisalarda xabar yuborilsin.">
            <ToggleRow
              label="Maktabga kirganda"
              description="Turniketdan kirganda xabar."
              checked={form.notifyOnEntry}
              onChange={(v) => set("notifyOnEntry", v)}
            />
            <ToggleRow
              label="Maktabdan chiqqanda"
              description="Turniketdan chiqqanda xabar."
              checked={form.notifyOnExit}
              onChange={(v) => set("notifyOnExit", v)}
            />
            <ToggleRow
              label="Dars/kurs davomati"
              description="Keldi/kechikdi/yo‘q holati bo‘yicha xabar."
              checked={form.notifyOnSession}
              onChange={(v) => set("notifyOnSession", v)}
            />
          </Section>

          <Section
            icon={Moon}
            title="Tinch soatlar"
            description="Shu oraliqdagi xabarlar oyna tugagach yuboriladi. Bo‘sh qoldirsangiz — o‘chirilgan."
          >
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                Boshlanishi
                <TimeInput
                  value={form.quietHoursStart ?? ""}
                  onChange={(v) => set("quietHoursStart", v || null)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                Tugashi
                <TimeInput
                  value={form.quietHoursEnd ?? ""}
                  onChange={(v) => set("quietHoursEnd", v || null)}
                />
              </label>
            </div>
          </Section>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-paper shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}
