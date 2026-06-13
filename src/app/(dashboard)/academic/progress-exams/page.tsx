"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { useI18n } from "@/lib/i18n/provider";
import { examColumns } from "../exam-columns";

export default function ProgressExamsPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.progressExams")}
      subtitle="Choraklik va oraliq imtihonlar"
      queryKey="lms-exams"
      path="/lms/exams"
      columns={examColumns}
      searchFields={["title"]}
    />
  );
}
