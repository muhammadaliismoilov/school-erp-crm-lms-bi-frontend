"use client";

import { useState } from "react";
import { ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import {
  useAddDocument,
  useDeleteDocument,
  useStudentDocuments,
} from "@/lib/api/student-profile";
import { Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export function DocumentsTab({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const { data, isLoading } = useStudentDocuments(studentId);
  const addDoc = useAddDocument(studentId);
  const delDoc = useDeleteDocument(studentId);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  async function submit() {
    if (!type.trim() || !fileUrl.trim()) return;
    await addDoc.mutateAsync({ type: type.trim(), fileUrl: fileUrl.trim() });
    setType("");
    setFileUrl("");
    setOpen(false);
  }

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Hujjat qo‘shish
          </Button>
        </div>
      )}

      {data.length === 0 ? (
        <div className="card grid place-items-center gap-2 py-20 text-center">
          <FileText className="h-8 w-8 text-ink-muted/60" />
          <p className="font-medium text-ink">Hujjatlar mavjud emas</p>
          <p className="text-sm text-ink-muted">Bu o‘quvchi uchun hali hujjat yuklanmagan</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((doc) => (
            <Card key={doc.id} className="flex items-start gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{doc.type}</p>
                <p className="text-xs text-ink-muted">{formatDate(doc.createdAt)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ochish
                  </a>
                  {canManage && (
                    <button
                      onClick={() => delDoc.mutate(doc.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-negative hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> O‘chirish
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Hujjat qo‘shish"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button loading={addDoc.isPending} onClick={submit}>
              Qo‘shish
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Hujjat turi" htmlFor="docType">
            <Input id="docType" value={type} onChange={(e) => setType(e.target.value)} placeholder="Masalan: Passport nusxasi" />
          </Field>
          <Field label="Fayl manzili (URL)" htmlFor="docUrl">
            <Input id="docUrl" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
