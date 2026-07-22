export interface RequestItem {
  id: number;
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
  requestStatusId?: number | null;
}

export interface CreateRequestBody {
  requestTypeId: number;
  departmentId: number;
  customerId: number;
  title: string;
  requestCode: string;
  loanNumber: string;
  amount: number;
  description?: string;
  personalTypeId: number;
  currentApprovalStepId: number;
  requestStatusId: number;
}

export interface EditRequestBody {
  id: number;
  requestTypeId: number;
  departmentId: number;
  customerId: number;
  title: string;
  requestCode: string;
  loanNumber: string;
  amount: number;
  description?: string;
  personalTypeId: number;
  currentApprovalStepId: number;
  requestStatusId: number;
}

export interface GetAllRequestsParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
