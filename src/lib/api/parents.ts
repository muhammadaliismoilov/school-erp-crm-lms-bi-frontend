import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

/** A student linked to a parent (subset returned by the children endpoints). */
export interface ParentChild {
  id: string;
  firstName: string;
  lastName?: string | null;
  middleName?: string | null;
  studentCode: string;
  photoUrl?: string | null;
  preferredLanguage?: string | null;
  gender?: string | null;
  currentClass?: { id: string; gradeLevel?: number; section?: string; name?: string } | null;
}

/**
 * Generates a readable random password for the "reset password" flow.
 * Ambiguous characters (0/O, 1/l/I) are excluded so it can be dictated.
 */
export function generatePassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

/** Display name for a child: "FirstName LastName" with trailing space trimmed. */
export function childName(child: { firstName: string; lastName?: string | null }): string {
  return `${child.firstName} ${child.lastName ?? ""}`.trim();
}

/** Human class label from a class ref: prefers `name`, falls back to `grade-section`. */
export function childClassLabel(
  cls?: { gradeLevel?: number; section?: string; name?: string } | null,
): string {
  if (!cls) return "";
  if (cls.name) return cls.name;
  return cls.gradeLevel != null ? `${cls.gradeLevel}-${cls.section ?? ""}` : "";
}

const PARENTS_KEY = ["parent-children"] as const;

/**
 * Children grouped by parent id, fetched in a single request for the whole
 * list page (avoids one request per row).
 */
export function useParentChildrenMap(parentIds: string[]) {
  const ids = [...parentIds].sort().join(",");
  return useQuery({
    queryKey: [...PARENTS_KEY, "map", ids],
    enabled: parentIds.length > 0,
    queryFn: () =>
      apiRequest<Record<string, ParentChild[]>>("/students/parents/children-map", {
        query: { ids },
      }),
  });
}

/** Children of a single parent (detail page "Farzandlari" tab). */
export function useParentChildren(parentId: string | null) {
  return useQuery({
    queryKey: [...PARENTS_KEY, "list", parentId],
    enabled: Boolean(parentId),
    queryFn: () =>
      apiRequest<ParentChild[]>(`/students/parents/${parentId}/children`),
  });
}

/**
 * Bulk-links every selected parent to every selected student by calling the
 * single-link endpoint for each pair. Sequential to stay gentle on the DB and
 * to surface the first failing pair cleanly.
 */
export function useLinkParents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentIds,
      parentIds,
      relation,
      isPrimary,
    }: {
      studentIds: string[];
      parentIds: string[];
      relation: string;
      isPrimary: boolean;
    }) => {
      let linked = 0;
      for (const studentId of studentIds) {
        for (const parentId of parentIds) {
          await apiRequest(`/students/${studentId}/parents`, {
            method: "POST",
            body: { parentId, relation, isPrimary },
          });
          linked += 1;
        }
      }
      return { linked };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PARENTS_KEY }),
  });
}

/** Detaches a student from a parent (the parent account itself is kept). */
export function useUnlinkChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, parentId }: { studentId: string; parentId: string }) =>
      apiRequest<{ id: string }>(`/students/${studentId}/parents/${parentId}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARENTS_KEY }),
  });
}
