import { apiClient } from "../../libs/api";
import type { DepartmentGradeItem } from "./types";

export async function getDepartmentGrade(id: number): Promise<DepartmentGradeItem> {
    return apiClient.request<DepartmentGradeItem>(
        `/services/app/DepartmentGrade/Get?Id=${id}`,
        { method: "GET" }
    );
}