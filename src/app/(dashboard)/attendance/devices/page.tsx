"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, Plus, RefreshCw, Router, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Spinner } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Can } from "@/components/auth/can";
import {
  useCreateDevice,
  useDeleteDevice,
  useRotateDeviceKey,
  useTurnstileDevices,
  useUpdateDevice,
  type DeviceWithKey,
  type TurnstileDevice,
  type TurnstileDirection,
} from "@/lib/api/turnstile-devices";

const DIRECTION_LABEL: Record<TurnstileDirection, string> = {
  in: "Kirish",
  out: "Chiqish",
  both: "Ikki tomonlama",
};

const DIRECTION_OPTIONS = [
  { value: "both", label: "Ikki tomonlama" },
  { value: "in", label: "Faqat kirish" },
  { value: "out", label: "Faqat chiqish" },
];

export default function TurnstileDevicesPage() {
  const devices = useTurnstileDevices();
  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const rotateMutation = useRotateDeviceKey();
  const deleteMutation = useDeleteDevice();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ deviceNumber: "", name: "", direction: "both" as TurnstileDirection });
  const [revealed, setRevealed] = useState<DeviceWithKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  function submitCreate() {
    if (!form.deviceNumber.trim()) return;
    createMutation.mutate(
      { deviceNumber: form.deviceNumber.trim(), name: form.name.trim() || undefined, direction: form.direction },
      {
        onSuccess: (dev) => {
          setCreateOpen(false);
          setForm({ deviceNumber: "", name: "", direction: "both" });
          setRevealed(dev);
        },
        onError: () => setToast("Qurilma yaratilmadi (raqam band bo‘lishi mumkin)"),
      },
    );
  }

  function rotate(device: TurnstileDevice) {
    rotateMutation.mutate(device.id, {
      onSuccess: (dev) => setRevealed(dev),
      onError: () => setToast("Kalit yangilanmadi"),
    });
  }

  function toggleActive(device: TurnstileDevice) {
    updateMutation.mutate(
      { id: device.id, input: { active: !device.active } },
      { onError: () => setToast("O‘zgartirib bo‘lmadi") },
    );
  }

  function remove(device: TurnstileDevice) {
    if (!confirm(`"${device.deviceNumber}" qurilmasi o‘chirilsinmi?`)) return;
    deleteMutation.mutate(device.id, {
      onSuccess: () => setToast("Qurilma o‘chirildi"),
      onError: () => setToast("O‘chirib bo‘lmadi"),
    });
  }

  return (
    <div>
      <PageHeader
        title="Turniket qurilmalari"
        subtitle="FaceID turniketlarni ro‘yxatga oling va API kalitini boshqaring."
        action={
          <Can permission="turnstile-devices.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Yangi qurilma
            </Button>
          </Can>
        }
      />

      {devices.isLoading ? (
        <div className="card flex justify-center py-20">
          <Spinner />
        </div>
      ) : devices.data && devices.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {devices.data.map((device) => (
            <div key={device.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy/10 text-navy">
                    <Router className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-ink">{device.deviceNumber}</div>
                    <div className="text-xs text-ink-muted">{device.name ?? "—"}</div>
                  </div>
                </div>
                <Can permission="turnstile-devices.update" mode="disable">
                  <Switch
                    checked={device.active}
                    onCheckedChange={() => toggleActive(device)}
                    aria-label="Faollik"
                  />
                </Can>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge tone="neutral">{DIRECTION_LABEL[device.direction]}</Badge>
                <Badge tone={device.active ? "positive" : "neutral"}>
                  {device.active ? "Faol" : "Nofaol"}
                </Badge>
                {device.lastSeenAt && (
                  <span className="ml-auto text-[11px] text-ink-muted">
                    oxirgi: {new Date(device.lastSeenAt).toLocaleString("uz")}
                  </span>
                )}
              </div>

              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                <Can permission="turnstile-devices.update">
                  <Button variant="secondary" size="sm" onClick={() => rotate(device)} loading={rotateMutation.isPending}>
                    <RefreshCw className="h-3.5 w-3.5" /> Kalitni yangilash
                  </Button>
                </Can>
                <Can permission="turnstile-devices.delete">
                  <Button variant="ghost" size="sm" onClick={() => remove(device)} className="text-negative">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card px-5 py-14 text-center text-sm text-ink-muted">
          Hali qurilma qo‘shilmagan.
        </div>
      )}

      {/* Yaratish modali */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Yangi turniket qurilmasi"
        subtitle="Qurilma raqami noyob bo‘lishi kerak."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={submitCreate} loading={createMutation.isPending}>
              Yaratish
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Qurilma raqami *" htmlFor="deviceNumber">
            <Input
              id="deviceNumber"
              value={form.deviceNumber}
              onChange={(e) => setForm((f) => ({ ...f, deviceNumber: e.target.value }))}
              placeholder="GATE-01"
            />
          </Field>
          <Field label="Nomi" htmlFor="name">
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Asosiy kirish"
            />
          </Field>
          <Field label="Yo‘nalish" htmlFor="direction">
            <Select
              id="direction"
              options={DIRECTION_OPTIONS}
              value={form.direction}
              onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as TurnstileDirection }))}
            />
          </Field>
        </div>
      </Modal>

      {/* API kalit oshkor modali */}
      <Modal
        open={revealed != null}
        onClose={() => setRevealed(null)}
        title="API kalit"
        subtitle="Bu kalit faqat HOZIR ko‘rsatiladi — qurilmaga joylashtiring va saqlab qo‘ying."
        size="md"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setRevealed(null)}>Yopdim, saqladim</Button>
          </div>
        }
      >
        {revealed && (
          <div className="space-y-3">
            <div className="text-sm text-ink-soft">
              Qurilma: <span className="font-medium text-ink">{revealed.deviceNumber}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-parchment p-3">
              <KeyRound className="h-4 w-4 shrink-0 text-ink-muted" />
              <code className="flex-1 break-all font-mono text-xs text-ink">{revealed.apiKey}</code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(revealed.apiKey);
                  setToast("Nusxalandi");
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Nusxa
              </Button>
            </div>
            <p className="text-xs text-caution">
              ⚠️ Kalitni boshqa hech qayerdan qayta ko‘rib bo‘lmaydi. Yo‘qotsangiz — qaytadan yangilang.
            </p>
            <div className="rounded-lg bg-parchment-deep/50 p-3 text-xs text-ink-soft">
              Turniket so‘rov sarlavhalari:
              <div className="mt-1 font-mono">
                X-Device-Number: {revealed.deviceNumber}
                <br />
                X-Device-Key: {"<kalit>"}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-paper shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}
