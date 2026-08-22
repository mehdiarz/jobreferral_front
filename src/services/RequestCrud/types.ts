export interface RequestDepartmentTypeOutputDto {
  id: number;
  name?: string | null;
  title?: string | null;
}

export interface RequestTypeOutputDto {
  id: number;
  title?: string | null;
}

export interface DepartmentOutputDto {
  id: number;
  title?: string | null;
}

export interface CustomerOutputDto {
  id: number;
  name?: string | null;
  cifNumber?: string | null;
  nationalCode?: string | null;
}

export interface PersonalTypeOutputDto {
  id: number;
  title?: string | null;
}

export interface RequestCommentOutputDto {
  id: number;
  userId?: number | null;
  description?: string | null;
  creationTime?: string | null;
}

export interface CollatralOutputDto {
  id: number;
  personTypeId?: number | null;
  collatralTypeId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  nationalCode?: string | null;
}

export interface RequestHistoryOutputDto {
  id: number;
  reviewerUserId?: number | null;
  description?: string | null;
  creationTime?: string | null;
}

export interface JudicialExpertOutputDto {
  firstName?: string | null;
  lastName?: string | null;
  code?: string | null;
  rank?: number | null;
  licenseIssueDate?: string | null;
  licenseExpireDate?: string | null;
  expertiseZoneId?: number | null;
  regionId?: number | null;
  licenseNumber?: string | null;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  lastModificationTime?: string | null;
  creationTime?: string | null;
  isDeleted?: boolean;
  isActive?: boolean;
  branchCodes?: string[] | null;
  region?: unknown | null;
  branches?: unknown[] | null;
  id: number;
}

export interface RequestItem {
  id: number;

  branchId?: string | null;
  supersvisionId?: string | null;

  actorUserId?: number | null;
  actorUserFullName?: string | null;
  actorUserRoleName?: string | null;

  requestTypeId?: number | null;
  requestTypeOutputDto?: RequestTypeOutputDto | null;

  departmentId?: number | null;
  departmentOutputDto?: DepartmentOutputDto | null;

  authorityDepartmentTypeId?: number | null;
  authorityDepartmentTypeOutputDto?: RequestDepartmentTypeOutputDto | null;

  currentDepartmentTypeId?: number | null;
  currentDepartmentTypeOutputDto?: RequestDepartmentTypeOutputDto | null;

  customerId?: number | null;
  customerOutputDto?: CustomerOutputDto | null;

  title?: string | null;
  requestCode?: string | null;
  loanNumber?: string | null;
  amount?: number | null;
  description?: string | null;

  personalTypeId?: number | null;
  personalTypeOutputDto?: PersonalTypeOutputDto | null;

  currentApprovalStepId?: number | null;
  requestStatusCode?: number | null;
  requestStatusTitle?: string | null;

  creationTime?: string | null;
  lastModificationTime?: string | null;
  isDeleted?: boolean;

  requestCommentOutputDtos?: RequestCommentOutputDto[] | null;
  collatralOutputDtos?: CollatralOutputDto[] | null;
  requestHistoryOutputDtos?: RequestHistoryOutputDto[] | null;
  judicialExpertOutputDtos?: JudicialExpertOutputDto[] | null;
}

export interface CreateRequestBody {
  id?: number;
  branchId?: string | null;
  supersvisionId?: string | null;

  actorUserId: number;
  requestTypeId: number;
  departmentId?: number | null;
  authorityDepartmentTypeId?: number | null;
  currentDepartmentTypeId?: number | null;
  customerId: number;

  title?: string | null;
  requestCode?: string | null;
  loanNumber?: string | null;
  amount: number;
  description?: string | null;

  personalTypeId: number;
  currentApprovalStepId: number;
  requestStatusCode: number;
}

export interface EditRequestBody {
  id: number;
  branchId?: string | null;
  supersvisionId?: string | null;

  actorUserId: number;
  requestTypeId: number;
  departmentId?: number | null;
  authorityDepartmentTypeId?: number | null;
  currentDepartmentTypeId?: number | null;
  customerId: number;

  title?: string | null;
  requestCode?: string | null;
  loanNumber?: string | null;
  amount: number;
  description?: string | null;

  personalTypeId: number;
  currentApprovalStepId: number;
  requestStatusCode: number;
}

export interface GetAllRequestsParams {
  actorUserFullName?: string;
  requestStatusTitle?: string;
  creationTime?: string | Date;
  authorityDepartmentTypeName?: string;
  currentDepartmentTypeName?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
