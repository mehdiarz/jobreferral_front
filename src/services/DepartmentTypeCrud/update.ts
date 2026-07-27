import { apiClient } from "../../libs/api";
import type { EditDepartmentTypeBody, DepartmentTypeItem } from "./types";

export async function editDepartmentType(
  body: EditDepartmentTypeBody,
): Promise<DepartmentTypeItem> {
  return apiClient.request<DepartmentTypeItem>(
    "/services/app/DepartmentTypeCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
