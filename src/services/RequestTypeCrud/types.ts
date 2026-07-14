export interface RequestTypeItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export interface CreateRequestTypeBody {
    code: string;
    title: string;
    description?: string;
}

export interface EditRequestTypeBody {
    id: number;
    code: string;
    title: string;
    description?: string;
}

export interface GetAllRequestTypesParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}