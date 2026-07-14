export interface CollatralTypeItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export interface CreateCollatralTypeBody {
    code: string;
    title: string;
    description?: string;
}

export interface EditCollatralTypeBody {
    id: number;
    code: string;
    title: string;
    description?: string;
}

export interface GetAllCollatralTypesParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}