import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

/** Mirrors backend UserGender in src/modules/users/enums/user.enums.ts. */
export const USER_GENDERS = ["male", "female"] as const;
export type UserGender = (typeof USER_GENDERS)[number];

/** Mirrors backend UserManagementRole — the roles surfaced in the management UI. */
export const USER_ROLES = [
  "ADMIN",
  "SALES_MANAGER",
  "STUDENT",
  "PARENT",
  "TEACHER",
  "TUTOR",
  "SUPERMANAGER",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Mirrors backend CommonStatus. */
export const USER_STATUSES = ["active", "inactive", "archived"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface UserRoleRef {
  name: string;
  title?: string | null;
}

/** Mirrors UserResponseSchema on the backend. */
export interface User {
  id: string;
  login: string;
  fullName: string;
  firstName: string;
  firstNameCyrillic: string;
  lastName: string;
  lastNameCyrillic: string;
  middleName?: string | null;
  middleNameCyrillic?: string | null;
  birthDate?: string | null;
  documentNumber?: string | null;
  gender: UserGender;
  phone?: string | null;
  email?: string | null;
  pinfl?: string | null;
  profileImageUrl?: string | null;
  profileImageFileId?: string | null;
  role?: string | null;
  roles: UserRoleRef[];
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface UserStats {
  userCount: number;
  roleCount: number;
  pageCount: number;
}

export interface UserPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface UserListResult {
  items: User[];
  meta: UserPageMeta;
  stats: UserStats;
}

export interface UserListParams {
  search?: string;
  role?: UserRole;
  gender?: UserGender;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

/** Matches CreateUserDto on the backend. */
export interface UserInput {
  username?: string;
  password?: string;
  email?: string;
  profileImageUrl?: string | null;
  profileImageFileId?: string | null;
  firstName: string;
  firstNameCyrillic: string;
  lastName: string;
  lastNameCyrillic: string;
  middleName?: string;
  middleNameCyrillic?: string;
  birthDate?: string;
  documentNumber?: string;
  gender: UserGender;
  phone?: string;
  role: UserRole;
  pinfl?: string;
}

/** Matches UpdateUserDto — every field optional, plus status. */
export type UserUpdateInput = Partial<UserInput> & { status?: UserStatus };

const usersApi = {
  list(params: UserListParams): Promise<UserListResult> {
    return apiRequest<UserListResult>("/users", { query: { ...params } });
  },
  get(id: string): Promise<User> {
    return apiRequest<User>(`/users/${id}`);
  },
  create(input: UserInput): Promise<User> {
    return apiRequest<User>("/users", { method: "POST", body: input });
  },
  update(id: string, input: UserUpdateInput): Promise<User> {
    return apiRequest<User>(`/users/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/users/${id}`, { method: "DELETE" });
  },
};

const USERS_KEY = ["users"] as const;

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: [...USERS_KEY, "detail", id],
    queryFn: () => usersApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInput) => usersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserUpdateInput }) =>
      usersApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
