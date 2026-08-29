import type { ExpertItem } from "../JudicialExperts/types.ts";

export interface CustomerOutputDto {
  id?: number;
  customerNumber?: string | null;
  cifNumber?: string | null;
  name?: string | null;
  nationalCode?: string | null;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  personalTypeId?: number;
}

export interface RequestSummaryDto {
  id: number;
  title?: string | null;
  description?: string | null;
  creationTime?: string;
  loanNumber?: string | null;
  requestCode?: string | null;
  amount?: number | null;
  customer?: CustomerOutputDto | null;
}

export interface JudicialExpertItemDto {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  code?: string | null;
  rank?: number | null;
  licenseIssueDate?: string | null;
  licenseExpireDate?: string | null;
  licenseNumber?: string | null;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  creationTime?: string;
  lastModificationTime?: string | null;
  regions?: unknown[];
  expertiseZoneIds?: number[];
  expertiseZones?: unknown[];
}

export interface CanceledJudicialItemDto {
  judicialExpert?: JudicialExpertItemDto | null;
  cancellationReason?: string | null;
  creationTime?: string;
  cycleId?: number;
  cancelledByUserId?: number;
}

export interface RequestWithJudicialExpertsItem {
  id: number;
  request?: RequestSummaryDto | null;
  activeJudicials?: JudicialExpertItemDto[] | null;
  canceledJudicials?: CanceledJudicialItemDto[] | null;
}

export interface RequestAssignedJudicialExpertItem {
  id: number;
  requestId: number;
  userId: number;
  judicialExpertId: number;
  calculatedWage: number;
  status: number;
  remainingCapacity?: number;
  lastModificationTime?: string | null;
  creationTime?: string;
  deletionTime?: string | null;
  isDeleted?: boolean;
  isActive?: boolean;
  requestOutputDto?: RequestSummaryDto | null;
  judicialExpertOutputDto?: ExpertItem | JudicialExpertItemDto | null;
}

export interface CreateRequestAssignedJudicialExpertBody {
  id?: number;
  requestId: number;
  userId: number;
  judicialExpertId: number;
  calculatedWage?: number;
  status?: number;
  isActive?: boolean;
}

export interface EditRequestAssignedJudicialExpertBody {
  id: number;
  requestId: number;
  userId: number;
  judicialExpertId: number;
  calculatedWage?: number;
  status?: number;
  isActive?: boolean;
}

export interface GetAllRequestAssignedJudicialExpertParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}
