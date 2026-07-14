import { apiClient } from "../../libs/api";
import type { EditDepartmentBody, DepartmentItem } from "./types";

export async function editDepartment(body: EditDepartmentBody): Promise<DepartmentItem> {
    return apiClient.request<DepartmentItem>("/services/app/DepartmentCrud/Edit", {
        method: "POST",
        body: JSON.stringify(body),
    });
}