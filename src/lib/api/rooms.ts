import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  floorLabel: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface RoomStats {
  total: number;
  totalFloors: number;
  addedToday: number;
}

export interface RoomListResult {
  items: Room[];
  stats: RoomStats;
}

export interface RoomInput {
  floor: number;
  roomNumber: string;
}

const api = {
  list(query?: { floor?: number; search?: string }): Promise<RoomListResult> {
    return apiRequest<RoomListResult>("/settings/rooms", { query });
  },
  create(input: RoomInput): Promise<Room> {
    return apiRequest<Room>("/settings/rooms", { method: "POST", body: input });
  },
  update(id: string, input: Partial<RoomInput>): Promise<Room> {
    return apiRequest<Room>(`/settings/rooms/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/settings/rooms/${id}`, { method: "DELETE" });
  },
};

const KEY = ["rooms"] as const;

export function useRooms(query?: { floor?: number; search?: string }) {
  return useQuery({
    queryKey: [...KEY, query],
    queryFn: () => api.list(query),
    staleTime: 30_000,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RoomInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RoomInput> }) =>
      api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
