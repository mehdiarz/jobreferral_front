import { apiClient } from "../../libs/api";

export interface CreateExpertBody {
    firstName: string;
    lastName: string;
    code: string;
    expertiseZoneId: number;
    regionId: number;
    licenseNumber?: string;
    phoneNumber?: string;
    mobileNumber?: string;
    email?: string;
    licenseIssueDate?: string | null;
    licenseExpireDate?: string | null;
}

export async function createExpert(body: CreateExpertBody): Promise<any> {
    return apiClient.request<any>("/services/app/JudicialExpertCrud/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}
