export interface DepartmentItem {
    id: number;
    code: string | null;
    title: string | null;
    departmentGradeId?: number | null;
    parentId?: number | null;
    regionId?: number | null;
    documentTypeId?: number | null;
    description?: string | null;
    isActive?: boolean;
}

export interface CreateDepartmentBody {
    code: string;
    title: string;
    departmentGradeId?: number;
    parentId?: number;
    regionId?: number;
    documentTypeId?: number;
    description?: string;
    isActive?: boolean;
}

export interface EditDepartmentBody {
    id: number;
    code: string;
    title: string;
    departmentGradeId?: number;
    parentId?: number;
    regionId?: number;
    documentTypeId?: number;
    description?: string;
    isActive?: boolean;
}

export interface GetAllDepartmentsParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}