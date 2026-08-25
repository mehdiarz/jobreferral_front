export interface CalculateBankFeeInput {
  propertyValue?: number | null;
  facilityAmount?: number | null;
}

export interface CalculateJudicialFeeInput {
  propertyValue?: number | null;
  facilityAmount?: number | null;
}

export interface FeeCalculationResultDto {
  propertyValue: number | null;
  facilityAmount: number | null;
  isBoard: boolean;
  bankFee: number | null;
  judicialFee: number | null;
}

export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}
