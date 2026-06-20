"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Phone } from "lucide-react";
import {
  fullName,
  primaryParent,
  useStudent,
  type Student,
} from "@/lib/api/students";
import { useAuthStore } from "@/lib/auth/store";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentFormDrawer } from "@/components/students/student-form-drawer";
import { OverviewTab } from "@/components/students/tabs/overview-tab";
import { GradesTab } from "@/components/students/tabs/grades-tab";
import { AttendanceTab } from "@/components/students/tabs/attendance-tab";
import { ScheduleTab } from "@/components/students/tabs/schedule-tab";
import { AchievementsTab } from "@/components/students/tabs/achievements-tab";
import { ConclusionsTab } from "@/components/students/tabs/conclusions-tab";
import { PaymentsTab } from "@/components/students/tabs/payments-tab";
import { DocumentsTab } from "@/components/students/tabs/documents-tab";
import { AnnualReportTab } from "@/components/students/tabs/annual-report-tab";

const TABS = [
  { key: "overview", label: "Umumiy ma'lumot" },
  { key: "grades", label: "Baholar" },
  { key: "attendance", label: "Davomat" },
  { key: "schedule", label: "Jadval" },
  { key: "achievements", label: "Yutuqlar" },
  { key: "conclusions", label: "Xulosalar" },
  { key: "payments", label: "To‘lovlar" },
  { key: "documents", label: "Hujjatlar" },
  { key: "annual", label: "Yillik hisobot" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const can = useAuthStore((s) => s.can);
  const canManage = can("students.manage");

  const [tab, setTab] = useState<TabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);

  const { data: student, isLoading, refetch } = useStudent(id);

  if (isLoading || !student) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const parent = primaryParent(student);
  const cls = student.currentClass
    ? `${student.currentClass.gradeLevel}-${student.currentClass.section}`
    : null;

  return (
    <div className="stagger">
      <button
        onClick={() => router.push("/students")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        O‘quvchilar ro‘yxati
      </button>

      {/* Header */}
      <div className="card mb-5 flex flex-wrap items-center gap-4 p-5">
        <StudentAvatar name={fullName(student)} seed={student.id} photoUrl={student.photoUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-ink">{fullName(student)}</h1>
            {cls && <Badge tone="neutral">{cls}</Badge>}
          </div>
          <p className="mt-1 font-mono text-sm text-ink-muted">{student.studentCode}</p>
        </div>
        <div className="flex items-center gap-2">
          {parent?.phone && (
            <a href={`tel:${parent.phone}`}>
              <Button variant="secondary">
                <Phone className="h-4 w-4" />
                Bog‘lanish
              </Button>
            </a>
          )}
          {canManage && (
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Profil tahrirlash
            </Button>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab studentId={id} />}
      {tab === "grades" && <GradesTab studentId={id} />}
      {tab === "attendance" && <AttendanceTab studentId={id} />}
      {tab === "schedule" && <ScheduleTab student={student as Student} />}
      {tab === "achievements" && <AchievementsTab studentId={id} canManage={canManage} />}
      {tab === "conclusions" && <ConclusionsTab studentId={id} canManage={canManage} />}
      {tab === "payments" && <PaymentsTab studentId={id} />}
      {tab === "documents" && <DocumentsTab studentId={id} canManage={canManage} />}
      {tab === "annual" && <AnnualReportTab studentId={id} canManage={canManage} />}

      <StudentFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        student={student}
        onSaved={() => refetch()}
      />
    </div>
  );
}
