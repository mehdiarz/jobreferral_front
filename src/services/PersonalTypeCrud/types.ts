export interface PersonalTypeItem {
  id: number;
  code: string | null;
  title: string | null;
  description?: string | null;
}

export interface CreatePersonalTypeBody {
  code: string;
  title: string;
  description?: string;
}

export interface EditPersonalTypeBody {
  id: number;
  code: string;
  title: string;
  description?: string;
}

export interface GetAllPersonalTypesParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
