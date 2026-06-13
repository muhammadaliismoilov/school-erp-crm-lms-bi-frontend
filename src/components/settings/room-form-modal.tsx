"use client";

import { useEffect, useState } from "react";
// DoorClosed intentionally omitted - modal uses text-only header via Modal component
import { useCreateRoom, useUpdateRoom, type Room } from "@/lib/api/rooms";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface Props {
  open: boolean;
  room: Room | null;
  onClose: () => void;
}

export function RoomFormModal({ open, room, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateRoom();
  const update = useUpdateRoom();
  const isEdit = Boolean(room);
  const pending = create.isPending || update.isPending;

  const [floor, setFloor] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFloor(room ? String(room.floor) : "1");
    setRoomNumber(room ? room.roomNumber : "");
    setError(null);
  }, [open, room]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const floorNum = Number(floor);
    if (!Number.isInteger(floorNum) || floorNum < 1 || floorNum > 100) {
      return setError(t("rooms.err.floor"));
    }
    if (!roomNumber.trim()) {
      return setError(t("rooms.err.roomNumber"));
    }

    try {
      if (isEdit && room) {
        await update.mutateAsync({ id: room.id, input: { floor: floorNum, roomNumber: roomNumber.trim() } });
      } else {
        await create.mutateAsync({ floor: floorNum, roomNumber: roomNumber.trim() });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  const title = isEdit ? t("rooms.edit.title") : t("rooms.new.title");
  const subtitle = isEdit ? t("rooms.edit.subtitle") : t("rooms.new.subtitle");
  const submitLabel = isEdit ? t("rooms.edit.submit") : t("rooms.new.submit");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="room-form" loading={pending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("rooms.f.floor")} htmlFor="room-floor">
            <Input
              id="room-floor"
              type="number"
              min={1}
              max={100}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="1"
            />
          </Field>
          <Field label={t("rooms.f.roomNumber")} htmlFor="room-number">
            <Input
              id="room-number"
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="101"
              maxLength={32}
            />
          </Field>
        </div>

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </form>
    </Modal>
  );
}
