import { apiClient } from "../../libs/api";
import type { CreateDepartmentGradeBody, DepartmentGradeItem } from "./types";

export async function createDepartmentGrade(
    body: CreateDepartmentGradeBody
): Promise<DepartmentGradeItem> {
    return apiClient.request<DepartmentGradeItem>("/services/app/DepartmentGrade/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}