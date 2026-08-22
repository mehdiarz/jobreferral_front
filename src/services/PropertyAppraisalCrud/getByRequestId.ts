import { apiClient } from "../../libs/api";
import type { PropertyAppraisalOutputDto } from "./types";

type AppraisalResponse =
  | PropertyAppraisalOutputDto[]
  | {
      result?: PropertyAppraisalOutputDto[] | null;
    }
  | null
  | undefined;

export async function getPropertyAppraisalByRequestId(
  requestId: number,
): Promise<PropertyAppraisalOutputDto[]> {
  const res = await apiClient.request<AppraisalResponse>(
    `/services/app/PropertyAppraisalCrud/GetByRequestId?Id=${requestId}`,
    { method: "GET" },
  );

  console.log("Property appraisal API response:", res);

  /*
   * حالت اول:
   * apiClient پاسخ را unwrap کرده است:
   * [
   *   { id: 8, creatorDepartmentId: 3 },
   *   { id: 9, creatorDepartmentId: 4 }
   * ]
   */
  if (Array.isArray(res)) {
    return res;
  }

  /*
   * حالت دوم:
   * apiClient کل پاسخ ABP را برگردانده است:
   * {
   *   result: [
   *     { id: 8, creatorDepartmentId: 3 },
   *     { id: 9, creatorDepartmentId: 4 }
   *   ]
   * }
   */
  if (Array.isArray(res?.result)) {
    return res.result;
  }

  return [];
}
