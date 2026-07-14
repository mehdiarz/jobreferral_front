import { apiClient } from "../../libs/api";

export interface CreateUserBody {
    userName: string;
    name: string;
    surname: string;
    emailAddress: string;
    isActive: boolean;
    roleNames: string[];
    password?: string;
}

export interface AbpResponse {
    result?: unknown;
    success: boolean;
    error?: { message?: string; details?: string };
}

export async function createUser(body: CreateUserBody): Promise<AbpResponse> {
    return apiClient.request<AbpResponse>("/services/app/User/Create", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
