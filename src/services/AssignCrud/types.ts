import type { ExpertItem } from "../JudicialExperts/types.ts";

export interface CustomerOutputDto {
  id?: number;
  customerNumber?: string | null;
  name?: string | null;
  nationalCode?: string | null;
  phoneNumber?: string | null;
  [key: string]: unknown;
}

export interface RequestSummaryOutputDto {
  id: number;
  title?: string | null;
  description?: string | null;
  creationTime?: string;
  loanNumber?: string | null;
  requestCode?: string | null;
  amount?: number | null;
  customer?: CustomerOutputDto | null;
}

export interface RequestAssignedJudicialExpertOutputDto {
  id: number;
  requestId: number;
  userId: number;
  judicialExpertId: number;
  calculatedWage: number;
  status: number;
  remainingCapacity: number;
  lastModificationTime: string | null;
  creationTime: string;
  deletionTime: string | null;
  isDeleted: boolean;
  isActive: boolean;
  requestOutputDto?: RequestSummaryOutputDto | null;
  judicialExpertOutputDto?: ExpertItem | null;
}

export interface CancelAndReassignParams {
  reqId: number;
  judicialExpertId: number;
  cancellationReason?: string;
  departmentTypeName?: string;
  replacementJudicialExpertId?: number;
  applicantMobileNumber?: string;
}

export interface RequestCommentInputDto {
  id?: number;
  requestId: number;
  userId: number;
  description?: string | null;
}

export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}
