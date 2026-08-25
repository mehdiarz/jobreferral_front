export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

export interface CreateFeeSlabBody {
  feeType: string;
  titleFa: string;
  fromAmount?: number;
  toAmount?: number | null;
  rate?: number;
  fixedAmount?: number | null;
  order?: number;
  descriptionFa?: string | null;
  isActive?: boolean;
}

export interface UpdateFeeSlabBody {
  id: number;
  titleFa: string;
  fromAmount?: number;
  toAmount?: number | null;
  rate?: number;
  fixedAmount?: number | null;
  order?: number;
  descriptionFa?: string | null;
  isActive?: boolean;
}

export interface FeeSlabItem {
  id: number;
  feeType: string | null;
  titleFa: string | null;
  fromAmount: number;
  toAmount: number | null;
  rate: number;
  fixedAmount: number | null;
  order: number;
  descriptionFa: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletionTime: string | null;
  lastModificationTime: string | null;
  creationTime: string;
}

export interface GetAllFeeSlabsParams {
  feeType?: string;
  isActive?: boolean;
}

export interface GetAllFeeSlabsResponse {
  items: FeeSlabItem[];
  totalCount: number;
}
