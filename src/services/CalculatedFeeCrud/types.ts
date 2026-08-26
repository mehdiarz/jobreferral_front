export interface CreateCalculatedFeeBody {
  requestId?: number | null;
  departmentId?: number | null;
  branchCode?: number | null;
  supervisionCode?: number | null;
  propertyValueBankFee?: number | null;
  loanAmountBankFee?: number | null;
  isBankFeeBoard?: boolean;
  propertyValueJudicialFee?: number | null;
  loanAmountJudicialFee?: number | null;
  isJudicialFeeBoard?: boolean;
}

export interface EditCalculatedFeeBody extends CreateCalculatedFeeBody {
  id: number;
}

export interface CalculatedFeeItem {
  id: number;
  requestId: number | null;
  actorUserId: number | null;
  departmentId: number | null;
  branchCode: number | null;
  supervisionCode: number | null;

  propertyValueBankFee: number | null;
  loanAmountBankFee: number | null;
  isBankFeeBoard: boolean;

  propertyValueJudicialFee: number | null;
  loanAmountJudicialFee: number | null;
  isJudicialFeeBoard: boolean;

  isDeleted: boolean;
  creationTime: string;
  lastModificationTime: string | null;
  deletionTime: string | null;
}

export interface GetAllCalculatedFeesParams {
  requestId?: number;
  actorUserId?: number;
  departmentId?: number;
  branchCode?: number;
  supervisionCode?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface GetAllCalculatedFeesResponse {
  items: CalculatedFeeItem[];
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
