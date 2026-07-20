export interface CreditLimitAuthorityItem {
  id: number;
  personalTypeId?: number | null;
  collatralTypeId?: number | null;
  regionId?: number | null;
  departmentGradeId?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
}

export interface CreateCreditLimitAuthorityBody {
  personalTypeId: number;
  collatralTypeId: number;
  regionId: number;
  departmentGradeId: number;
  minAmount: number;
  maxAmount: number;
}

export interface EditCreditLimitAuthorityBody {
  id: number;
  personalTypeId: number;
  collatralTypeId: number;
  regionId: number;
  departmentGradeId: number;
  minAmount: number;
  maxAmount: number;
}
