export interface ExpertiseZoneItem {
  id?: number;
  code?: string | null;
  title?: string | null;
  [key: string]: any;
}

export interface CollatralItem {
  id: number;
  collatralTypeId?: number | null;
  requestId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  nationalCode?: string | null;
  personTypeId?: number | null;
  expertiseZoneCodes?: string[] | null;
  expertiseZones?: ExpertiseZoneItem[] | null;
  creationTime?: string;
  lastModificationTime?: string | null;
  isDeleted?: boolean;
  deletionTime?: string | null;
}

export interface CreateCollatralBody {
  id?: number;
  collatralTypeId?: number | null; // اختیاری شد
  requestId: number;
  firstName?: string | null;
  lastName?: string | null;
  nationalCode?: string | null;
  personTypeId?: number; // پیش‌فرض 1
  expertiseZoneCodes?: string[] | null;
}

export interface EditCollatralBody {
  id: number;
  collatralTypeId?: number | null; // اختیاری شد
  requestId: number;
  firstName?: string | null;
  lastName?: string | null;
  nationalCode?: string | null;
  personTypeId?: number; // پیش‌فرض 1
  expertiseZoneCodes?: string[] | null;
}

export interface GetAllCollatralsParams {
  requestId?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
