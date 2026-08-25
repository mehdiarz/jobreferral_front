import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetAllExpertsParams,
  GetAllExpertsResponse,
} from "./types";

export async function getAllExperts(
  params: GetAllExpertsParams = {},
): Promise<GetAllExpertsResponse> {
  const searchParams = new URLSearchParams();

  const firstName = params.firstName?.trim();
  const lastName = params.lastName?.trim();
  const code = params.code?.trim();
  const expertiseZoneTitle = params.expertiseZoneTitle?.trim();
  const licenseNumber = params.licenseNumber?.trim();
  const sorting = params.sorting?.trim();

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

  if (params.skipCount !== undefined) {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (params.maxResultCount !== undefined) {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const queryString = searchParams.toString();

  const response = await apiClient.request<AbpResponse<GetAllExpertsResponse>>(
    `/services/app/JudicialExpertCrud/GetAll${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
    },
  );

  return {
    items: response.result.items ?? [],
    totalCount: response.result.totalCount ?? 0,
  };
}
