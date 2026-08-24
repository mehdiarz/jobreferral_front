import { apiClient } from "../../libs/api";
import type {
  ExpertItem,
  GetAllExpertsParams,
  GetAllExpertsResponse,
} from "./types";

export async function getAllExperts(
  params?: GetAllExpertsParams,
): Promise<GetAllExpertsResponse> {
  const searchParams = new URLSearchParams();

  const firstName = params?.firstName?.trim();
  const lastName = params?.lastName?.trim();
  const code = params?.code?.trim();
  const expertiseZoneTitle = params?.expertiseZoneTitle?.trim();
  const licenseNumber = params?.licenseNumber?.trim();
  const sorting = params?.sorting?.trim();

  if (firstName) {
    searchParams.set("FirstName", firstName);
  }

  if (lastName) {
    searchParams.set("LastName", lastName);
  }

  if (code) {
    searchParams.set("Code", code);
  }

  if (expertiseZoneTitle) {
    searchParams.set("ExpertiseZoneTitle", expertiseZoneTitle);
  }

  if (licenseNumber) {
    searchParams.set("LicenseNumber", licenseNumber);
  }

  if (sorting) {
    searchParams.set("Sorting", sorting);
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

  const res = await apiClient.request<{
    result?: {
      items?: ExpertItem[];
      totalCount?: number;
    };
    items?: ExpertItem[];
    totalCount?: number;
  }>(url, {
    method: "GET",
  });

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
