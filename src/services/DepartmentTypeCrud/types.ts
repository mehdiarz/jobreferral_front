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
  name?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
