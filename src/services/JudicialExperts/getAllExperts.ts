import { apiClient } from "../../libs/api";

export interface ExpertItem {
    id: number;
    firstName: string | null;
    lastName: string | null;
    code: string | null;
    licenseNumber: string | null;
    phoneNumber: string | null;
    mobileNumber: string | null;
    email: string | null;
    licenseIssueDate: string | null;
    licenseExpireDate: string | null;
    expertiseZoneId: number;
    regionId: number;
    creationTime: string;
    lastModificationTime: string | null;
    isDeleted: boolean;
}

export async function getAllExperts(): Promise<{ items: ExpertItem[]; totalCount: number }> {
    const res = await apiClient.request<any>("/services/app/JudicialExpertCrud/GetAll", { method: "GET" });
    const items = res?.items ?? res?.result?.items ?? [];
    const totalCount = res?.totalCount ?? res?.result?.totalCount ?? items.length;
    return { items, totalCount };
}
