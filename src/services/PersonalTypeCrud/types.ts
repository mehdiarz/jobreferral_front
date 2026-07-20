export interface PersonalTypeItem {
  id: number;
  code: string | null;
  title: string | null;
  creditScore?: number | null;
  creditWeight?: number | null;
  description?: string | null;
}

export interface CreatePersonalTypeBody {
  code: string;
  title: string;
  creditScore?: number;
  creditWeight?: number;
  description?: string;
}

export interface EditPersonalTypeBody {
  id: number;
  code: string;
  title: string;
  creditScore?: number;
  creditWeight?: number;
  description?: string;
}

export interface GetAllPersonalTypesParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
