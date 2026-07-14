import { apiClient } from "../../libs/api";
import type { CreateDepartmentBody, DepartmentItem } from "./types";

export async function createDepartment(body: CreateDepartmentBody): Promise<DepartmentItem> {
    return apiClient.request<DepartmentItem>("/services/app/DepartmentCrud/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}