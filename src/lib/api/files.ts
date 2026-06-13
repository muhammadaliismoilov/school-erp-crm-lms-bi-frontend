import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "./client";

/** Mirrors FileResponseSchema on the backend (POST /files/upload). */
export interface UploadedFile {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url?: string | null;
  createdAt?: string;
}

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB — matches the backend limit.
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<UploadedFile>("/files/upload", { method: "POST", body: form });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file),
  });
}
