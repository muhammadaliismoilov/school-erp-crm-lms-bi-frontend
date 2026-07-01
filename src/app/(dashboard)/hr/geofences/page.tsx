"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  GEOFENCE_STATUS_LABELS,
  formatCoordinate,
  PAGE_SIZES,
  useCreateGeofence,
  useDeleteGeofence,
  useGeofenceList,
  useUpdateGeofence,
  type Geofence,
  type GeofenceInput,
} from "@/lib/api/hr-geofences";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

export default function GeofencesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Geofence | null>(null);
  const [deleting, setDeleting] = useState<Geofence | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const { data, isLoading, isError, refetch } = useGeofenceList({ page, limit, search });
  const deleteGeofence = useDeleteGeofence();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteGeofence.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Geozona o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Geozonalar"
        subtitle="Davomat geozonalarini boshqarish"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Geozona qo‘shish
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Geozonalarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Nomi</th>
                <th className="px-4 py-3 font-medium">Kenglik</th>
                <th className="px-4 py-3 font-medium">Uzunlik</th>
                <th className="px-4 py-3 font-medium">Radius (m)</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={7}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={7}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={7}><span className="text-ink-muted">Ma‘lumot yo‘q</span></StateRow>
              ) : (
                rows.map((g, i) => (
                  <tr key={g.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <MapPin className="h-4 w-4 text-ink-muted" />
                        {g.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 tnum text-ink-soft">{formatCoordinate(g.latitude)}</td>
                    <td className="px-4 py-3 tnum text-ink-soft">{formatCoordinate(g.longitude)}</td>
                    <td className="px-4 py-3 tnum text-ink-soft">{g.radiusM ?? 0}m</td>
                    <td className="px-4 py-3">
                      <Badge tone={g.isActive ? "positive" : "negative"}>
                        {g.isActive ? GEOFENCE_STATUS_LABELS.active : GEOFENCE_STATUS_LABELS.inactive}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(g);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O‘chirish"
                          onClick={() => setDeleting(g)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-ink-muted">
            <span>Ko‘rsatilmoqda</span>
            <span className="tnum text-ink">{from} - {to}</span>
            <span>dan</span>
            <span className="tnum text-ink">{total}</span>
            <span>natija</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              className="h-8 w-20 py-0"
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            />
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tnum px-2 text-ink-muted">{page} / {pageCount}</span>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(pageCount)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <GeofenceDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Geozonani o‘chirish">
        <p className="text-sm text-ink-muted">{deleting?.name} geozonasi o‘chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteGeofence.isPending} onClick={confirmDelete}>O‘chirish</Button>
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

function StateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">{children}</td>
    </tr>
  );
}

function GeofenceDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Geofence | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createGeofence = useCreateGeofence();
  const updateGeofence = useUpdateGeofence();

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setLatitude(editing.latitude != null ? String(editing.latitude) : "");
      setLongitude(editing.longitude != null ? String(editing.longitude) : "");
      setRadius(editing.radiusM != null ? String(editing.radiusM) : "100");
    } else {
      setName("");
      setLatitude("");
      setLongitude("");
      setRadius("100");
    }
    setError(null);
  }, [open, editing]);

  function parseNum(value: string): number | null {
    const n = Number(value);
    return value.trim() !== "" && Number.isFinite(n) ? n : null;
  }

  async function submit() {
    if (!name.trim()) {
      setError("Geozona nomini kiriting");
      return;
    }
    const lat = parseNum(latitude);
    const lng = parseNum(longitude);
    if (lat === null || lng === null) {
      setError("Kenglik va uzunlikni kiriting");
      return;
    }
    const payload: GeofenceInput = {
      name: name.trim(),
      latitude: lat,
      longitude: lng,
      radiusM: parseNum(radius) ?? 0,
    };
    try {
      if (editing) {
        await updateGeofence.mutateAsync({ id: editing.id, input: payload });
        onSaved("Geozona yangilandi");
      } else {
        await createGeofence.mutateAsync(payload);
        onSaved("Geozona yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createGeofence.isPending || updateGeofence.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Geozonani tahrirlash" : "Geozona yaratish"}
      icon={<MapPin className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            {editing ? "Yangilash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nomi" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Geozona nomini kiriting" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kenglik" required>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Uzunlik" required>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
        <Field label="Radius (m)">
          <Input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            placeholder="100"
          />
        </Field>

        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-negative">*</span>}
      </label>
      {children}
    </div>
  );
}
