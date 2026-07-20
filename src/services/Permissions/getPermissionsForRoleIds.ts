/**
 * Fetches permissions for the given role IDs.
 * POST /api/services/app/Role/GetRoleForEditByIdList
 * Body: [{ id: 1 }, { id: 3 }]
 * Response: result.items[].grantedPermissionNames — merge and dedupe.
 */

import { apiClient } from "../../libs/api";

export interface GetRoleForEditItem {
  role: {
    name: string;
    displayName: string;
    description: string | null;
    isStatic: boolean;
    id: number;
  };
  permissions: unknown;
  grantedPermissionNames: string[];
}

export interface GetRoleForEditByIdListResponse {
  result: {
    items: GetRoleForEditItem[];
  };
  success: boolean;
}

/**
 * Calls GetRoleForEditByIdList and returns a merged, deduplicated list of permission names.
 * Call after login (token must be set).
 */
export async function getPermissionsForRoleIds(
  roleIds: number[],
): Promise<string[]> {
  if (roleIds.length === 0) return [];

  const body = roleIds.map((id) => ({ id }));
  const res = await apiClient.request<GetRoleForEditByIdListResponse>(
    "/services/app/Role/GetRoleForEditByIdList",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  const items = res?.result?.items ?? [];
  const merged: string[] = [];
  for (const item of items) {
    if (Array.isArray(item.grantedPermissionNames)) {
      merged.push(...item.grantedPermissionNames);
    }
  }
  return [...new Set(merged)];
}
