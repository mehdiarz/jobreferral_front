export interface DocumentItem {
  id: number;
  documentTypeId?: number | null;
  requestId?: number | null;
}

export interface CreateDocumentBody {
  documentTypeId: number;
  requestId: number;
}

export interface EditDocumentBody {
  id: number;
  documentTypeId: number;
  requestId: number;
}

export interface GetAllDocumentsParams {
  requestId?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
