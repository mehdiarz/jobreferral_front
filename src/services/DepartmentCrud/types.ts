export interface DepartmentItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export interface CreateDepartmentBody {
    code: string;
    title: string;
    description?: string;
}

export interface EditDepartmentBody {
    id: number;
    code: string;
    title: string;
    description?: string;
}

export interface GetAllDepartmentsParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}