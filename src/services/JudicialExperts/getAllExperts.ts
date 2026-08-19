import { apiClient } from "../../libs/api";

export interface ExpertItem {
  id: number;
  firstName: string | null;
  lastName: string | null;
  code: string | null;
  rank: number;
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

export interface GetAllExpertsParams {
  firstName?: string;
  lastName?: string;
  code?: string;
  expertiseZoneTitle?: string;
  licenseNumber?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export async function getAllExperts(params?: GetAllExpertsParams): Promise<{
  items: unknown[];
  totalCount: number;
}> {
  const searchParams = new URLSearchParams();

  if (params?.firstName?.trim()) {
    searchParams.set("FirstName", params.firstName.trim());
  }

  if (params?.lastName?.trim()) {
    searchParams.set("LastName", params.lastName.trim());
  }

  if (params?.code?.trim()) {
    searchParams.set("Code", params.code.trim());
  }

  if (params?.expertiseZoneTitle?.trim()) {
    searchParams.set("ExpertiseZoneTitle", params.expertiseZoneTitle.trim());
  }

  if (params?.licenseNumber?.trim()) {
    searchParams.set("LicenseNumber", params.licenseNumber.trim());
  }

  if (params?.sorting?.trim()) {
    searchParams.set("Sorting", params.sorting.trim());
  }

  if (typeof params?.skipCount === "number") {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (typeof params?.maxResultCount === "number") {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const query = searchParams.toString();

  const url = query
    ? `/services/app/JudicialExpertCrud/GetAll?${query}`
    : "/services/app/JudicialExpertCrud/GetAll";

  const res = await apiClient.request<any>(url, {
    method: "GET",
  });

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
