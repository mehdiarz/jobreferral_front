import { apiClient } from "../../libs/api";
import type { GetAllPersonalTypesParams, PersonalTypeItem } from "./types";

type GetAllPersonalTypesApiResponse = {
  result?: {
    items?: PersonalTypeItem[];
    totalCount?: number;
  };
  items?: PersonalTypeItem[];
  totalCount?: number;
};

export async function getAllPersonalTypes(
  params?: GetAllPersonalTypesParams,
): Promise<{
  items: PersonalTypeItem[];
  totalCount: number;
}> {
  const searchParams = new URLSearchParams();

  const title = params?.title?.trim();
  const code = params?.code?.trim();
  const description = params?.description?.trim();

  if (title) {
    searchParams.set("Title", title);
  }

  if (code) {
    searchParams.set("Code", code);
  }

  if (typeof params?.creditScore === "number") {
    searchParams.set("CreditScore", String(params.creditScore));
  }

  if (typeof params?.creditWeight === "number") {
    searchParams.set("CreditWeight", String(params.creditWeight));
  }

  if (description) {
    searchParams.set("Description", description);
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
    ? `/services/app/PersonalType/GetAll?${query}`
    : "/services/app/PersonalType/GetAll";

  const res = await apiClient.request<GetAllPersonalTypesApiResponse>(url, {
    method: "GET",
  });

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
