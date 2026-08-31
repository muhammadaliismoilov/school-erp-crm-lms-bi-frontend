import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";
import { useEnabledModules } from "./schools";

export interface BranchNode {
  id: string;
  name: string;
  schoolId: string | null;
  schoolName: string | null;
  parentId: string | null;
  parentName: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  createdAt: string;
  children: BranchNode[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface BranchListResult {
  items: BranchNode[];
  meta: PageMeta;
}

export interface BranchListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BranchInput {
  name: string;
  schoolId?: string;
  parentId?: string;
  isHeadOffice?: boolean;
  isActive?: boolean;
}

export interface BranchOption {
  id: string;
  label: string;
}

function cleanParams<T extends object>(params: T): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value as string | number;
    }
  }
  return out;
}

const api = {
  list(params: BranchListParams): Promise<BranchListResult> {
    return apiRequest<BranchListResult>("/hr/branches", { query: cleanParams(params) });
  },
  options(): Promise<BranchOption[]> {
    return apiRequest<BranchOption[]>("/hr/branches/options");
  },
  schoolOptions(): Promise<BranchOption[]> {
    return apiRequest<BranchOption[]>("/hr/schools/options");
  },
  create(input: BranchInput): Promise<BranchNode> {
    return apiRequest<BranchNode>("/hr/branches", { method: "POST", body: input });
  },
  update(id: string, input: Partial<BranchInput>): Promise<BranchNode> {
    return apiRequest<BranchNode>(`/hr/branches/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/branches/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "branches"] as const;

export function useBranchTree(params: BranchListParams) {
  return useQuery({
    queryKey: [...KEY, "tree", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

/**
 * Filial tanlovlari.
 *
 * Bayroq maktabda o'chiq bo'lsa so'rov UMUMAN yuborilmaydi: backend u yo'lni
 * `@RequiresModule('branches')` bilan 403 qiladi, ya'ni so'rov faqat konsolni
 * xato bilan to'ldirardi. Chaqiruvchilar allaqachon `data ?? []` yozgani uchun
 * ro'yxat shunchaki bo'sh bo'ladi — bu tekshiruvni HAR bir formada takrorlash
 * shart emas.
 */
export function useBranchOptions() {
  const modules = useEnabledModules();
  return useQuery({
    queryKey: [...KEY, "options"],
    queryFn: () => api.options(),
    enabled: modules.data?.branches === true,
    staleTime: 5 * 60_000,
  });
}

/** Filiallar bo'limi shu maktabga yoqilganmi (formalarda maydonni yashirish uchun). */
export function useBranchesEnabled(): boolean {
  return useEnabledModules().data?.branches === true;
}

/** Boshqaruv (Maktablar) bo'limidagi maktablar — filial ularga bog'lanadi. */
export function useSchoolOptions() {
  return useQuery({
    queryKey: ["hr", "schools", "options"],
    queryFn: () => api.schoolOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BranchInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BranchInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Daraxtni yassi ro'yxatga aylantiradi (har bir tugun chuqurligi bilan). */
export function flattenBranches(nodes: BranchNode[], depth = 0): { node: BranchNode; depth: number }[] {
  const out: { node: BranchNode; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length) out.push(...flattenBranches(node.children, depth + 1));
  }
  return out;
}

export const BRANCH_STATUS_LABELS = { active: "Faol", inactive: "Faol emas" } as const;
export const PAGE_SIZES = [10, 20, 50, 100] as const;
