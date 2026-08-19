export interface RequestCommentItem {
  id: number;
  requestId?: number;
  userId?: number | null;
  description?: string;
  creationTime?: string;
}

export interface CreateRequestCommentBody {
  requestId: number;
  userId: number;
  description: string;
}

export interface GetAllRequestCommentsParams {
  requestId?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
