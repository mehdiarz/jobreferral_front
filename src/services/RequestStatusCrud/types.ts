export interface RequestStatusItem {
  id: number;
  title?: string | null;
  code?: number;
}

export interface CreateRequestStatusBody {
  title: string;
  code: number;
}

export interface EditRequestStatusBody extends CreateRequestStatusBody {
  id: number;
}

export interface GetAllRequestStatusParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
