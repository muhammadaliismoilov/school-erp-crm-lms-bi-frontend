"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { useI18n } from "@/lib/i18n/provider";
import { studentColumns } from "../student-columns";

export default function AcademicStudentsPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.students")}
      subtitle="Maktab o‘quvchilari"
      queryKey="academic-students"
      path="/students"
      columns={studentColumns}
      serverPaginated
    />
  );
}
