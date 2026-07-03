"use client";

import { useEffect, useState } from "react";
import { Check, Send, Smartphone, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Spinner } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteChannel,
  useMyChannels,
  useRegisterChannel,
  type NotificationChannel,
  type NotificationChannelType,
} from "@/lib/api/notification-channels";

const META: Record<
  NotificationChannelType,
  { title: string; icon: typeof Send; hint: string; placeholder: string }
> = {
  telegram: {
    title: "Telegram",
    icon: Send,
    hint: "Botni ishga tushirib, chat ID ni kiriting (bot orqali olinadi).",
    placeholder: "Telegram chat ID",
  },
  push: {
    title: "Mobil ilova (push)",
    icon: Smartphone,
    hint: "Mobil ilova qurilma tokenini avtomatik ro‘yxatga oladi.",
    placeholder: "Push token",
  },
};

export default function NotificationChannelsPage() {
  const channels = useMyChannels();
  const register = useRegisterChannel();
  const del = useDeleteChannel();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const byType = (t: NotificationChannelType) => channels.data?.find((c) => c.type === t);

  return (
    <div>
      <PageHeader
        title="Xabar kanallari"
        subtitle="Farzandingiz davomati bo‘yicha xabarlarni qayerga olishni sozlang."
      />

      {channels.isLoading ? (
        <div className="card flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="grid max-w-2xl gap-4">
          {(["telegram", "push"] as NotificationChannelType[]).map((type) => (
            <ChannelCard
              key={type}
              type={type}
              channel={byType(type)}
              saving={register.isPending}
              onSave={(address, isPreferred) =>
                register.mutate(
                  { type, address, isPreferred },
                  {
                    onSuccess: () => setToast("Saqlandi ✓"),
                    onError: () => setToast("Saqlab bo‘lmadi"),
                  },
                )
              }
              onDelete={() =>
                del.mutate(type, {
                  onSuccess: () => setToast("O‘chirildi"),
                  onError: () => setToast("O‘chirib bo‘lmadi"),
                })
              }
            />
          ))}
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

function ChannelCard({
  type,
  channel,
  saving,
  onSave,
  onDelete,
}: {
  type: NotificationChannelType;
  channel?: NotificationChannel;
  saving: boolean;
  onSave: (address: string, isPreferred: boolean) => void;
  onDelete: () => void;
}) {
  const meta = META[type];
  const Icon = meta.icon;
  const [address, setAddress] = useState(channel?.address ?? "");

  useEffect(() => {
    setAddress(channel?.address ?? "");
  }, [channel?.address]);

  const connected = Boolean(channel);
  const dirty = address.trim() !== (channel?.address ?? "");

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-parchment-deep/60 text-ink-soft">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display font-semibold text-ink">{meta.title}</div>
            <div className="text-xs text-ink-muted">{meta.hint}</div>
          </div>
        </div>
        {connected && (
          <Badge tone={channel!.isPreferred ? "accent" : "positive"}>
            {channel!.isPreferred ? "Asosiy" : "Ulangan"}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={meta.placeholder}
          className="min-w-[12rem] flex-1"
        />
        <Button
          size="sm"
          disabled={!address.trim() || (!dirty && connected && channel!.isPreferred)}
          loading={saving}
          onClick={() => onSave(address.trim(), channel?.isPreferred ?? false)}
        >
          <Check className="h-4 w-4" /> Saqlash
        </Button>
        {connected && (
          <>
            {!channel!.isPreferred && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSave(channel!.address, true)}
                title="Asosiy kanal qilish"
              >
                <Star className="h-4 w-4" /> Asosiy
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-negative" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
