import { apiClient } from "../../libs/api";
import type { GetAllDepartmentGradesParams, DepartmentGradeItem } from "./types";

export async function getAllDepartmentGrades(
    params?: GetAllDepartmentGradesParams
): Promise<{ items: DepartmentGradeItem[]; totalCount: number }> {
    const searchParams = new URLSearchParams();

    if (typeof params?.isActive === "boolean") {
        searchParams.set("IsActive", String(params.isActive));
    }

    if (params?.sorting) {
        searchParams.set("Sorting", params.sorting);
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

    const res = await apiClient.request<any>(url, { method: "GET" });
    const items = res?.items ?? res?.result?.items ?? [];
    const totalCount = res?.totalCount ?? res?.result?.totalCount ?? items.length;

    return { items, totalCount };
}