export interface CustomerItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export interface CreateCustomerBody {
    code: string;
    title: string;
    description?: string;
}

export interface GetAllCustomersParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}