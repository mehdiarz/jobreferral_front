export interface DepartmentGradeItem {
    id: number;
    code: string | null;
    title: string | null;
    grade?: number | null;
    description?: string | null;
    isActive?: boolean;
}

export interface CreateDepartmentGradeBody {
    code: string;
    title: string;
    grade?: number;
    description?: string;
    isActive?: boolean;
}

export interface EditDepartmentGradeBody {
    id: number;
    code: string;
    title: string;
    grade?: number;
    description?: string;
    isActive?: boolean;
}

export interface GetAllDepartmentGradesParams {
    isActive?: boolean;
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}