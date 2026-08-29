import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  CancelAndReassignParams,
  RequestAssignedJudicialExpertOutputDto,
} from "./types";

export async function cancelAndReassign(
  params: CancelAndReassignParams,
): Promise<RequestAssignedJudicialExpertOutputDto[]> {
  const queryParams = new URLSearchParams();

  queryParams.set("reqId", String(params.reqId));
  queryParams.set("judicialExpertId", String(params.judicialExpertId));

  if (params.cancellationReason) {
    queryParams.set("cancellationReason", params.cancellationReason);
  }

  if (params.departmentTypeName) {
    queryParams.set("departmentTypeName", params.departmentTypeName);
  }

  if (
    params.replacementJudicialExpertId !== undefined &&
    params.replacementJudicialExpertId !== null
  ) {
    queryParams.set(
      "replacementJudicialExpertId",
      String(params.replacementJudicialExpertId),
    );
  }

  if (params.applicantMobileNumber) {
    queryParams.set("applicantMobileNumber", params.applicantMobileNumber);
  }

  const queryString = queryParams.toString();
  const endpoint = `/services/app/Assign/CancelAndReassign${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await apiClient.request<
    | AbpResponse<RequestAssignedJudicialExpertOutputDto[]>
    | RequestAssignedJudicialExpertOutputDto[]
  >(endpoint, {
    method: "POST",
  });

  // پشتیبانی از قالب ABP Response و حالت خروجی مستقیم آرایه
  if (
    res &&
    typeof res === "object" &&
    "result" in res &&
    Array.isArray(res.result)
  ) {
    return res.result;
  }

  if (Array.isArray(res)) {
    return res;
  }

  return [];
}
