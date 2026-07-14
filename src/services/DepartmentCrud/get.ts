import { apiClient } from "../../libs/api";
import type { DepartmentItem } from "./types";

export async function getDepartment(id: number): Promise<DepartmentItem> {
    return apiClient.request<DepartmentItem>(
        `/services/app/DepartmentCrud/Get?Id=${id}`,
        { method: "GET" }
    );
}