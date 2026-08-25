export interface RequestSignatureInputDto {
  id?: number;
  requestId?: number;
  personCode?: number;
  currentRequestState?: number;
  currentDepartmentTypeId?: number;
  fullName?: string | null;
  roleName?: string | null;
}

export interface RequestSignatureOutputDto {
  id: number;
  requestId: number;
  personCode: number;
  currentRequestState: number;
  currentDepartmentTypeId: number;
  fullName: string | null;
  roleName: string | null;
  creationTime: string;
  lastModificationTime: string | null;
  isDeleted: boolean;
  deletionTime: string | null;
}

export interface GetAllRequestSignaturesParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface PagedResultDto<T> {
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
