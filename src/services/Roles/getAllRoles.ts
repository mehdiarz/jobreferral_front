import { apiClient } from "../../libs/api";

export interface RoleItem {
  id: number;
  name: string;
  displayName: string;
  normalizedName?: string | null;
  description?: string | null;
  grantedPermissions?: string[] | null;
  roleCode?: string | null;
}

export interface GetAllRolesParams {
  keyword?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

interface GetAllRolesResponse {
  result?: {
    totalCount?: number;
    items?: RoleItem[];
  };
  success: boolean;
  error?: {
    message?: string;
    details?: string;
  };
}

export interface PagedRolesResult {
  totalCount: number;
  items: RoleItem[];
}

export async function getAllRoles(
  params: GetAllRolesParams = {},
): Promise<PagedRolesResult> {
  const searchParams = new URLSearchParams();

  const keyword = params.keyword?.trim();
  if (keyword) {
    searchParams.set("Keyword", keyword);
  }

  const sorting = params.sorting?.trim();
  if (sorting) {
    searchParams.set("Sorting", sorting);
  }

  searchParams.set("SkipCount", String(Math.max(0, params.skipCount ?? 0)));

  searchParams.set(
    "MaxResultCount",
    String(Math.max(1, params.maxResultCount ?? 10)),
  );

  const queryString = searchParams.toString();

  const res = await apiClient.request<GetAllRolesResponse>(
    `/services/app/Role/GetAll${queryString ? `?${queryString}` : ""}`,
    { method: "GET" },
  );

  return {
    totalCount: res?.result?.totalCount ?? 0,
    items: res?.result?.items ?? [],
  };
}
