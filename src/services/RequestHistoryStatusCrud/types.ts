export interface RequestHistoryStatusItem {
  id: number;
  title?: string | null;
  code?: number;
}

export interface CreateRequestHistoryStatusBody {
  title: string;
  code: number;
}

export interface EditRequestHistoryStatusBody extends CreateRequestHistoryStatusBody {
  id: number;
}

export interface GetAllRequestHistoryStatusParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
