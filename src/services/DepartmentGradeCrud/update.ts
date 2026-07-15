import { apiClient } from "../../libs/api";
import type { EditDepartmentGradeBody, DepartmentGradeItem } from "./types";

export async function editDepartmentGrade(
    body: EditDepartmentGradeBody
): Promise<DepartmentGradeItem> {
    return apiClient.request<DepartmentGradeItem>("/services/app/DepartmentGrade/Edit", {
        method: "POST",
        body: JSON.stringify(body),
    });
}