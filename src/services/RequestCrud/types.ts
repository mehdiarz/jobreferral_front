export interface RequestItem {
  id: number;
  actorUserFullName?: string | null;
  requestStatusTitle?: string | null;
  actorUserRoleName?: string | null;
  requestTypeId?: number | null;
  departmentId?: number | null;
  customerId?: number | null;
  title?: string | null;
  requestCode?: string | null;
  loanNumber?: string | null;
  amount?: number | null;
  description?: string | null;
  personalTypeId?: number | null;
  currentApprovalStepId?: number | null;
  requestStatusCode?: number | null;
  creationTime?: string;
  lastModificationTime?: string | null;
  isDeleted?: boolean;

  // 👇 اینارو اضافه کن
  requestTypeOutputDto?: {
    id: number;
    title?: string;
  } | null;
  departmentOutputDto?: {
    id: number;
    title?: string;
  } | null;
  customerOutputDto?: {
    id: number;
    name?: string;
    cifNumber?: string;
  } | null;
  personalTypeOutputDto?: {
    id: number;
    title?: string;
  } | null;
  requestCommentOutputDtos?: Array<{
    id: number;
    userId?: number;
    description?: string;
    creationTime?: string;
  }> | null;
  collatralOutputDtos?: Array<{
    id: number;
    personTypeId?: number;
    collatralTypeId?: number;
    firstName?: string;
    lastName?: string;
    nationalCode?: string;
  }> | null;
  requestHistoryOutputDtos?: Array<{
    id: number;
    reviewerUserId?: number;
    description?: string;
    creationTime?: string;
  }> | null;
}
export interface CreateRequestBody {
  actorUserId?: number;
  requestTypeId: number;
  departmentId: number;
  customerId: number;
  title: string;
  requestCode: string;
  loanNumber: string;
  amount: number;
  description?: string;
  personalTypeId: number;
  currentApprovalStepId?: number;
  requestStatusCode?: number;
}

export interface EditRequestBody {
  id: number;
  actorUserId?: number;
  requestTypeId: number;
  departmentId: number;
  customerId: number;
  title: string;
  requestCode: string;
  loanNumber: string;
  amount: number;
  description?: string;
  personalTypeId: number;
  currentApprovalStepId?: number;
  requestStatusCode?: number;
}

export interface GetAllRequestsParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
