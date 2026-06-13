"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { useI18n } from "@/lib/i18n/provider";
import { studentColumns } from "../student-columns";

const DEPARTED = new Set(["withdrawn", "transferred", "graduated"]);

export default function DepartedStudentsPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.departed")}
      subtitle="Maktabni tark etgan o‘quvchilar (ko‘chgan, bitirgan, chiqarilgan)"
      queryKey="academic-departed"
      path="/students"
      columns={studentColumns}
      query={{ limit: 100 }}
      searchFields={["firstName", "lastName", "studentCode"]}
      filter={(r) => DEPARTED.has(String(r.status))}
    />
  );
}
