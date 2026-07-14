import { apiClient } from "../../libs/api";

export async function deleteDepartment(id: number): Promise<any> {
    return apiClient.request<any>("/services/app/DepartmentCrud/Remove", {
        method: "POST",
        body: JSON.stringify({ id }),
    });
}