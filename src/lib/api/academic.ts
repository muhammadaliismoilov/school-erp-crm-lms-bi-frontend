import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface SchoolClass {
  id: string;
  name: string;
  gradeLevel: number;
  section: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Quarter {
  id: string;
  quarterNumber: number;
  startDate: string;
  endDate: string;
  status: string;
  name?: { uz?: string; ru?: string; en?: string };
}

export function useClasses() {
  return useQuery({
    queryKey: ["academic", "classes"],
    queryFn: () => apiRequest<SchoolClass[]>("/academic/classes"),
    staleTime: 60_000,
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["academic", "subjects"],
    queryFn: () => apiRequest<Subject[]>("/academic/subjects"),
    staleTime: 60_000,
  });
}

export function useQuarters() {
  return useQuery({
    queryKey: ["academic", "quarters"],
    queryFn: () => apiRequest<Quarter[]>("/academic/quarters"),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
