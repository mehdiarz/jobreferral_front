export interface DepartmentTypeItem {
  id: number;
  name: string | null;
}

export interface CreateDepartmentTypeBody {
  name: string;
}

export interface EditDepartmentTypeBody {
  id: number;
  name: string;
}

export interface GetAllDepartmentTypesParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
