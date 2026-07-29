export interface StatusManagementItem {
  id: number;
  currentStatus?: number;
  ifAccepted?: number;
  ifRejected?: number;
  acceptedRuleCode?: number;
  rejectedRuleCode?: number;
  ifAcceptedRuleCode?: number;
  ifRejectedRuleCode?: number;
}

export interface CreateStatusManagementBody {
  currentStatus: number;
  ifAccepted: number;
  ifRejected: number;
  acceptedRuleCode: number;
  rejectedRuleCode: number;
  ifAcceptedRuleCode: number;
  ifRejectedRuleCode: number;
}

export interface EditStatusManagementBody extends CreateStatusManagementBody {
  id: number;
}

export interface GetAllStatusManagementParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
