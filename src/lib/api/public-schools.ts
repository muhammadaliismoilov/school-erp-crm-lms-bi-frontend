import { apiRequest } from "./client";

export interface ResolvedSchool {
  schoolId: string;
  schoolName: string;
  logoUrl?: string | null;
}

/** Backend `GET /public/schools/resolve` — auth talab qilmaydi. */
export function resolveSchoolByHostname(hostname: string): Promise<ResolvedSchool> {
  return apiRequest<ResolvedSchool>("/public/schools/resolve", {
    query: { hostname },
    auth: false,
  });
}
