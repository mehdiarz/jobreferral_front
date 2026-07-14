import { apiClient } from "../../libs/api";

export interface RoleItem {
    name: string;
    displayName: string;
    normalizedName: string;
    description: string | null;
    grantedPermissions: string[];
    id: number;
}

export interface GetAllRolesResponse {
    result: {
        totalCount: number;
        items: RoleItem[];
    };
    success: boolean;
}

export async function getAllRoles(): Promise<{ totalCount: number; items: RoleItem[] }> {
    const res = await apiClient.request<GetAllRolesResponse>(
        "/services/app/Role/GetAll",
        { method: "GET" }
    );
    const result = res?.result;
    return {
        totalCount: result?.totalCount ?? 0,
        items: result?.items ?? [],
    };
}
