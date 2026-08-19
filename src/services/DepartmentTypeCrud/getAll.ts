import { apiClient } from "../../libs/api";
import type { GetAllDepartmentTypesParams, DepartmentTypeItem } from "./types";

type GetAllDepartmentTypesApiResponse = {
  result?: {
    items?: DepartmentTypeItem[];
    totalCount?: number;
  };
  items?: DepartmentTypeItem[];
  totalCount?: number;
};

export async function getAllDepartmentTypes(
  params?: GetAllDepartmentTypesParams,
): Promise<{ items: DepartmentTypeItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams();

  const name = params?.name?.trim();
  const sorting = params?.sorting?.trim();

  if (name) {
    searchParams.set("Name", name);
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
    ? `/services/app/DepartmentTypeCrud/GetAll?${query}`
    : "/services/app/DepartmentTypeCrud/GetAll";

  const res = await apiClient.request<GetAllDepartmentTypesApiResponse>(url, {
    method: "GET",
  });

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
