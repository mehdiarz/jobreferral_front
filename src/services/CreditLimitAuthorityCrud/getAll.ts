import { apiClient } from "../../libs/api";
import type {
  CreditLimitAuthorityItem,
  GetAllCreditLimitAuthoritiesParams,
} from "./types";

type GetAllCreditLimitAuthoritiesApiResponse = {
  result?: {
    items?: CreditLimitAuthorityItem[];
    totalCount?: number;
  };
  items?: CreditLimitAuthorityItem[];
  totalCount?: number;
};

export async function getAllCreditLimitAuthorities(
  params?: GetAllCreditLimitAuthoritiesParams,
): Promise<{
  items: CreditLimitAuthorityItem[];
  totalCount: number;
}> {
  const searchParams = new URLSearchParams();

  const personalTypeName = params?.personalTypeName?.trim();
  const collatralTypeName = params?.collatralTypeName?.trim();
  const departmentGradeName = params?.departmentGradeName?.trim();

  if (typeof params?.departmentGradeId === "number") {
    searchParams.set("DepartmentGradeId", String(params.departmentGradeId));
  }

  if (personalTypeName) {
    searchParams.set("PersonalTypeName", personalTypeName);
  }

  if (collatralTypeName) {
    searchParams.set("CollatralTypeName", collatralTypeName);
  }

  if (departmentGradeName) {
    searchParams.set("DepartmentGradeName", departmentGradeName);
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
    ? `/services/app/CreditLimitAuthorityCrud/GetAll?${query}`
    : "/services/app/CreditLimitAuthorityCrud/GetAll";

  const res = await apiClient.request<GetAllCreditLimitAuthoritiesApiResponse>(
    url,
    {
      method: "GET",
    },
  );

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
