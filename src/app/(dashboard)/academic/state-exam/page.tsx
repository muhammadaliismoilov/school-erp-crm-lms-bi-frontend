"use client";

import { AcademicTablePage } from "@/components/academic/table-page";
import { useI18n } from "@/lib/i18n/provider";
import { examColumns } from "../exam-columns";

export default function StateExamPage() {
  const { t } = useI18n();
  return (
    <AcademicTablePage
      title={t("nav.ac.stateExam")}
      subtitle="Davlat (yakuniy) imtihonlari"
      queryKey="lms-exams-state"
      path="/lms/exams"
      query={{ limit: 100 }}
      columns={examColumns}
      searchFields={["title"]}
      filter={(r) => String(r.status) === "finished" || String(r.status) === "scheduled"}
    />
  );
}
