import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface LocalizedLabel {
  uz: string;
  ru: string;
  en: string;
}

/** Ruxsatdan ALOHIDA qatlam: `all` — barcha qatorlar, `own` — faqat o'ziniki. */
export type DataScope = "all" | "own";

export interface RolePermission {
  code: string;
  module: string;
  action: string;
}

/** Mirrors RoleResponseSchema on the backend. */
export interface Role {
  id: string;
  name: string;
  displayName: string;
  title: string;
  description?: string | null;
  isSystem: boolean;
  dataScope: DataScope;
  permissionCount: number;
  permissions: RolePermission[];
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface RoleStats {
  roleCount: number;
  permissionCount: number;
  foundCount: number;
}

export interface RolePageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface RoleListResult {
  items: Role[];
  meta: RolePageMeta;
  stats: RoleStats;
}

export interface RoleListParams {
  search?: string;
  page?: number;
  limit?: number;
}

/** Matches CreateRoleDto / UpdateRoleDto. Title is derived from name by the backend. */
export interface RoleInput {
  name: string;
  permissionCodes: string[];
  title?: Partial<LocalizedLabel>;
  description?: Partial<LocalizedLabel>;
  dataScope?: DataScope;
}

// ---- Permission catalog (GET /permissions/catalog) ----

export interface CatalogPermission {
  code: string;
  action: string;
  label: LocalizedLabel;
}

export interface CatalogResource {
  module: string;
  label: LocalizedLabel;
  permissionCount: number;
  permissions: CatalogPermission[];
}

export interface CatalogCategory {
  key: string;
  label: LocalizedLabel;
  permissionCount: number;
  resources: CatalogResource[];
}

export interface PermissionCatalog {
  totalPermissions: number;
  categories: CatalogCategory[];
}

const rolesApi = {
  list(params: RoleListParams): Promise<RoleListResult> {
    return apiRequest<RoleListResult>("/roles", { query: { ...params } });
  },
  get(id: string): Promise<Role> {
    return apiRequest<Role>(`/roles/${id}`);
  },
  create(input: RoleInput): Promise<Role> {
    return apiRequest<Role>("/roles", { method: "POST", body: input });
  },
  update(id: string, input: Partial<RoleInput>): Promise<Role> {
    return apiRequest<Role>(`/roles/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/roles/${id}`, { method: "DELETE" });
  },
  catalog(): Promise<PermissionCatalog> {
    return apiRequest<PermissionCatalog>("/permissions/catalog");
  },
};

const ROLES_KEY = ["roles"] as const;

export function useRoles(params: RoleListParams) {
  return useQuery({
    queryKey: [...ROLES_KEY, params],
    queryFn: () => rolesApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useRole(id: string | null) {
  return useQuery({
    queryKey: [...ROLES_KEY, "detail", id],
    queryFn: () => rolesApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: ["permissions", "catalog"],
    queryFn: () => rolesApi.catalog(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleInput) => rolesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RoleInput> }) =>
      rolesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}
