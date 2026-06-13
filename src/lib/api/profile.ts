import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface UserProfile {
  id: string;
  login: string;
  fullName: string;
  firstName: string;
  firstNameCyrillic: string;
  lastName: string;
  lastNameCyrillic: string;
  middleName: string | null;
  middleNameCyrillic: string | null;
  birthDate: string | null;
  documentNumber: string | null;
  gender: "male" | "female";
  phone: string | null;
  email: string | null;
  pinfl: string | null;
  profileImageUrl: string | null;
  profileImageFileId: string | null;
  role: string | null;
  roles: { name: string; title: string }[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Fields the user may edit on the "Mening profilim" form. */
export interface UpdateProfileInput {
  firstName?: string;
  firstNameCyrillic?: string;
  lastName?: string;
  lastNameCyrillic?: string;
  middleName?: string;
  middleNameCyrillic?: string;
  birthDate?: string;
  documentNumber?: string;
  gender?: "male" | "female";
  phone?: string;
  email?: string;
  profileImageUrl?: string;
}

const profileApi = {
  me(): Promise<UserProfile> {
    return apiRequest<UserProfile>("/profile/me");
  },
  update(input: UpdateProfileInput): Promise<UserProfile> {
    return apiRequest<UserProfile>("/profile/me", {
      method: "PATCH",
      body: input,
    });
  },
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.me(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.update(input),
    onSuccess: (data) => qc.setQueryData(["profile", "me"], data),
  });
}
