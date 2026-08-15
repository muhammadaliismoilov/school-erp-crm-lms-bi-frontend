import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

/** Mirrors backend `ClassLeaderAssignmentResponse` — ism/sinf nomi serverda hal qilinadi. */
export interface ClassLeaderAssignment {
  id: string;
  teacherId: string;
  teacherName: string | null;
  classId: string;
  className: string | null;
  startDate: string;
  endDate: string | null;
  note: string | null;
  createdAt: string;
}

export interface ClassLeaderQueryParams {
  teacherId?: string;
  classId?: string;
  activeOn?: string;
}

export interface CreateClassLeaderInput {
  teacherId: string;
  classId: string;
  startDate: string;
  endDate?: string;
  note?: string;
}

export interface UpdateClassLeaderInput {
  endDate?: string;
  note?: string;
}

function cleanParams<T extends object>(params: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = String(value);
    }
  }
  return out;
}

const api = {
  // Backend sahifalamaydi — biriktiruvlar soni sinflar soniga bog'liq, tabiiy chegaralangan.
  list(params: ClassLeaderQueryParams = {}): Promise<ClassLeaderAssignment[]> {
    return apiRequest<ClassLeaderAssignment[]>("/hr/class-leaderships", { query: cleanParams(params) });
  },
  create(input: CreateClassLeaderInput): Promise<ClassLeaderAssignment> {
    return apiRequest<ClassLeaderAssignment>("/hr/class-leaderships", { method: "POST", body: input });
  },
  update(id: string, input: UpdateClassLeaderInput): Promise<ClassLeaderAssignment> {
    return apiRequest<ClassLeaderAssignment>(`/hr/class-leaderships/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/class-leaderships/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "class-leaderships"] as const;

export function useClassLeaderList(params: ClassLeaderQueryParams = {}) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    staleTime: 20_000,
  });
}

export function useCreateClassLeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClassLeaderInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateClassLeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClassLeaderInput }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteClassLeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export type ClassLeaderStatus = "active" | "upcoming" | "ended";

export const CLASS_LEADER_STATUS_LABELS: Record<ClassLeaderStatus, string> = {
  active: "Faol",
  upcoming: "Kelajakda",
  ended: "Tugagan",
};

/** Sanalardan holatni hisoblaydi — backend saqlamaydi, doim jonli. */
export function classLeaderStatus(a: Pick<ClassLeaderAssignment, "startDate" | "endDate">): ClassLeaderStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (a.startDate > today) return "upcoming";
  if (a.endDate && a.endDate < today) return "ended";
  return "active";
}
