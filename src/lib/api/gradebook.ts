import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface GradebookLesson {
  id: string;
  lessonDate: string;
  topic?: string | null;
  status: string;
}

export interface GradebookStudent {
  id: string;
  fullName: string;
  studentCode: string;
  average?: number | null;
}

export interface GradebookCell {
  lessonId: string;
  studentId: string;
  grade?: number | null;
  homeworkDone: boolean;
  comment?: string | null;
}

export interface Gradebook {
  lessons: GradebookLesson[];
  students: GradebookStudent[];
  cells: GradebookCell[];
}

export interface GradebookFilter {
  classId?: string;
  subjectId?: string;
  quarterId?: string;
}

export interface UpsertGradeInput {
  lessonId: string;
  studentId: string;
  grade?: number | null;
  homeworkDone?: boolean;
  comment?: string;
}

const ready = (f: GradebookFilter): f is Required<GradebookFilter> =>
  Boolean(f.classId && f.subjectId && f.quarterId);

export function useGradebook(filter: GradebookFilter) {
  const enabled = ready(filter);
  return useQuery({
    queryKey: ["gradebook", filter],
    enabled,
    queryFn: () =>
      apiRequest<Gradebook>("/lms/gradebook", {
        query: {
          classId: filter.classId,
          subjectId: filter.subjectId,
          quarterId: filter.quarterId,
        },
      }),
  });
}

export function useUpsertGrade(filter: GradebookFilter) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertGradeInput) =>
      apiRequest("/lms/gradebook/grade", { method: "PUT", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gradebook", filter] }),
  });
}
