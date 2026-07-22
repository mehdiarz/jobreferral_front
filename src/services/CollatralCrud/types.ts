export interface CollatralItem {
  id: number;
  collatralTypeId?: number | null;
  requestId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  nationalCode?: string | null;
  personTypeId?: number | null;
}

export interface CreateCollatralBody {
  collatralTypeId: number;
  requestId: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  personTypeId: number;
}

export interface EditCollatralBody {
  id: number;
  collatralTypeId: number;
  requestId: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  personTypeId: number;
}

export interface GetAllCollatralsParams {
  requestId?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
