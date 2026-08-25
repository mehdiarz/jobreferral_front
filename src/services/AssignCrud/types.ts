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
}

export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}
