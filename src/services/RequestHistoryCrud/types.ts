export interface RequestHistoryItem {
  id: number;
  requestId?: number;
  reviewerUserId?: number;
  oldParameterJson?: string;
  newParameterJson?: string;
  oldRequestStatusCode?: number;
  newRequestStatusCode?: number;
  requestHistoryStatusCode?: number;
  description?: string;
  creationTime?: string;
}

export interface CreateRequestHistoryBody {
  requestId: number;
  reviewerUserId: number;
  oldParameterJson?: string;
  newParameterJson?: string;
  oldRequestStatusCode?: number;
  newRequestStatusCode?: number;
  requestHistoryStatusCode?: number;
  description?: string;
}

export interface EditRequestHistoryBody extends CreateRequestHistoryBody {
  id: number;
}

export interface GetAllRequestHistoryParams {
  requestId?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
