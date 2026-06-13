import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { Page } from "./types";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  birthDate?: string | null;
  gender?: string | null;
  status?: string | null;
  nationalId?: string | null;
  currentClassId?: string | null;
  createdAt: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  studentCode: string;
  birthDate?: string;
  gender?: string;
}

const studentsApi = {
  list(params: ListParams): Promise<Page<Student>> {
    return apiRequest<Page<Student>>("/students", { query: { ...params } });
  },
  create(input: CreateStudentInput): Promise<Student> {
    return apiRequest<Student>("/students", { method: "POST", body: input });
  },
};

export function useStudents(params: ListParams) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: () => studentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => studentsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}
