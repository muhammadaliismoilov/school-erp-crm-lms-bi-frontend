import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { ResourceRecord } from "@/lib/api/resource";
import { loc, formatDate } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  test: "Test",
  control_work: "Nazorat ishi",
  dictation: "Diktant",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Qoralama",
  scheduled: "Tayyor",
  finished: "Yakunlangan",
};

/**
 * Imtihon jadvali ustunlari — state-exam sahifasi ulashadi.
 * Backend yangi (flat) `/lms/exams` javob shakliga moslangan:
 * className / subjectName / teacherName / examType / status.
 * Page faylidan tashqarida turishi shart: Next.js page'lardan ixtiyoriy
 * export'ni taqiqlaydi.
 */
export const examColumns: Column<ResourceRecord>[] = [
  {
    key: "title",
    header: "Imtihon",
    render: (r) => <span className="font-medium text-ink">{String(r.title ?? "—")}</span>,
  },
  {
    key: "class",
    header: "Sinf / Kurs",
    render: (r) => String(r.className ?? r.courseName ?? "—"),
  },
  { key: "subject", header: "Fan", render: (r) => loc(r.subjectName) || "—" },
  { key: "teacher", header: "O‘qituvchi", render: (r) => String(r.teacherName ?? "—") },
  {
    key: "type",
    header: "Turi",
    render: (r) => <Badge tone="accent">{TYPE_LABEL[String(r.examType)] ?? String(r.examType ?? "—")}</Badge>,
  },
  { key: "examDate", header: "Sana", render: (r) => formatDate(r.examDate as string) },
  {
    key: "status",
    header: "Holat",
    render: (r) => <Badge tone="neutral">{STATUS_LABEL[String(r.status)] ?? String(r.status ?? "—")}</Badge>,
  },
];
