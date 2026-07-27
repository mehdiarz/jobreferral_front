import { apiClient } from "../../libs/api";
import type { CreateDepartmentTypeBody, DepartmentTypeItem } from "./types";

export async function createDepartmentType(
  body: CreateDepartmentTypeBody,
): Promise<DepartmentTypeItem> {
  return apiClient.request<DepartmentTypeItem>(
    "/services/app/DepartmentTypeCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
