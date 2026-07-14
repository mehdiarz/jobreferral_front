export interface DocumentTypeItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export interface CreateDocumentTypeBody {
    code: string;
    title: string;
    description?: string;
}

export interface EditDocumentTypeBody {
    id: number;
    code: string;
    title: string;
    description?: string;
}

export interface GetAllDocumentTypesParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}