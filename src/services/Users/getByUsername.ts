import { apiClient } from "../../libs/api";

export interface UserDto {
  id: number;
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  isActive: boolean;
  fullName: string;
  lastLoginTime: string | null;
  creationTime: string;
  roleNames: string[];
  roles?: string[];
}

export interface GetUserByUsernameResponse {
  result: UserDto;
  success: boolean;
  error?: { message?: string; details?: string };
}

/**
 * Get user details by userName
 * GET /api/services/app/User/GetByUsername?userName={userName}
 */
export async function getUserByUsername(userName: string): Promise<UserDto> {
  const searchParams = new URLSearchParams({ userName });

  const res = await apiClient.request<GetUserByUsernameResponse>(
    `/services/app/User/GetByUsername?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  return res?.result ?? (res as unknown as UserDto);
}
