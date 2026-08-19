import { apiClient } from "../../libs/api";
import type {
  DepartmentGradeItem,
  GetAllDepartmentGradesParams,
} from "./types";

type GetAllDepartmentGradesResponse = {
  result?: {
    items?: DepartmentGradeItem[];
    totalCount?: number;
  };

  items?: DepartmentGradeItem[];
  totalCount?: number;
};

export async function getAllDepartmentGrades(
  params?: GetAllDepartmentGradesParams,
): Promise<{
  items: DepartmentGradeItem[];
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

  if (typeof params?.grade === "number") {
    searchParams.set("Grade", String(params.grade));
  }

  if (description) {
    searchParams.set("Description", description);
  }

  if (typeof params?.isActive === "boolean") {
    searchParams.set("IsActive", String(params.isActive));
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
    ? `/services/app/DepartmentGrade/GetAll?${query}`
    : "/services/app/DepartmentGrade/GetAll";

  const res = await apiClient.request<GetAllDepartmentGradesResponse>(url, {
    method: "GET",
  });

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
