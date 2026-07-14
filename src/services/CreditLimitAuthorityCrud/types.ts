export interface CreditLimitAuthorityItem {
    id: number;
    personType: string;
    collateralTypeId: number;
    departmentId: number;
    minAmount: number;
    maxAmount: number;
}

export interface CreateCreditLimitAuthorityBody {
    personType: string;
    collateralTypeId: number;
    departmentId: number;
    minAmount: number;
    maxAmount: number;
}

export interface EditCreditLimitAuthorityBody {
    id: number;
    personType: string;
    collateralTypeId: number;
    departmentId: number;
    minAmount: number;
    maxAmount: number;
}

export interface GetAllCreditLimitAuthoritiesParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}