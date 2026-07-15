import { apiClient } from "../../libs/api";

export async function deleteDepartmentGrade(id: number): Promise<any> {
    return apiClient.request<any>("/services/app/DepartmentGrade/Remove", {
        method: "POST",
        body: JSON.stringify({ id }),
    });
}