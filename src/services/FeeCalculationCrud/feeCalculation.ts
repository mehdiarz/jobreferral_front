import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  CalculateBankFeeInput,
  CalculateJudicialFeeInput,
  FeeCalculationResultDto,
} from "./types";

export async function calculateBankFee(
  body: CalculateBankFeeInput,
): Promise<FeeCalculationResultDto> {
  const response = await apiClient.request<
    AbpResponse<FeeCalculationResultDto>
  >("/services/app/FeeCalculation/CalculateBank", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return response.result;
}

export async function calculateJudicialFee(
  body: CalculateJudicialFeeInput,
): Promise<FeeCalculationResultDto> {
  const response = await apiClient.request<
    AbpResponse<FeeCalculationResultDto>
  >("/services/app/FeeCalculation/CalculateJudicial", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return response.result;
}
