export interface DocumentItem {
  id: number;
  documentTypeId?: number | null;
  requestId?: number | null;
  fileFormat?: string | null;
  fileAddress?: string | null;
}

export interface CreateDocumentBody {
  documentTypeId: number;
  requestId: number;
  fileFormat: string;
  fileAddress: string;
}

export interface EditDocumentBody {
  id: number;
  documentTypeId: number;
  requestId: number;
  fileFormat: string;
  fileAddress: string;
}

export interface GetAllDocumentsParams {
  requestId?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
