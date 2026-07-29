export interface RequestAssignedJudicialExpertItem {
  id: number;
  requestId?: number;
  userId?: number;
  judicialExpertId?: number;
  calculatedWage?: number;
  status?: number;
  isActive?: boolean;
}

export interface CreateRequestAssignedJudicialExpertBody {
  requestId: number;
  userId: number;
  judicialExpertId: number;
  calculatedWage?: number;
  status?: number;
  isActive?: boolean;
}

export interface EditRequestAssignedJudicialExpertBody extends CreateRequestAssignedJudicialExpertBody {
  id: number;
}

export interface GetAllRequestAssignedJudicialExpertParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
