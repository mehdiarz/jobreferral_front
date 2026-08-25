export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

export interface CreateFeeSettingBody {
  code?: string | null;
  titleFa: string;
  feeType: string;
  value: number;
  unitFa: string;
  descriptionFa?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateFeeSettingBody {
  id: number;
  titleFa: string;
  value: number;
  unitFa: string;
  descriptionFa?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface FeeSettingItem {
  id: number;
  code: string | null;
  titleFa: string | null;
  feeType: string | null;
  value: number;
  unitFa: string | null;
  descriptionFa: string | null;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  deletionTime: string | null;
  lastModificationTime: string | null;
  creationTime: string;
}

export interface GetAllFeeSettingsParams {
  feeType?: string;
  search?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface GetAllFeeSettingsResponse {
  items: FeeSettingItem[];
  totalCount: number;
}
