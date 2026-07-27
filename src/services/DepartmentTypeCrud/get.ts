import { apiClient } from "../../libs/api";
import type { DepartmentTypeItem } from "./types";

export async function getDepartmentType(
  id: number,
): Promise<DepartmentTypeItem> {
  return apiClient.request<DepartmentTypeItem>(
    `/services/app/DepartmentTypeCrud/Get?Id=${id}`,
    { method: "GET" },
  );
}
