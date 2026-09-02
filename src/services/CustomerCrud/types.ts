export interface CustomerItem {
  id: number;
  personalTypeId?: number | null;
  cifNumber?: string | null;
  name?: string | null;
  mobileNumber?: string | null;
  creationTime?: string;
  lastModificationTime?: string | null;
  nationalCode?: string | null;
  isDeleted?: boolean;
  deletionTime?: string | null;
}

export interface CreateCustomerBody {
  personalTypeId: number;
  cifNumber?: string | null;
  name?: string | null;
  mobileNumber?: string | null;
  nationalCode?: string | null;
}

export interface EditCustomerBody {
  id: number;
  mobileNumber?: string | null;
}

export interface GetAllCustomersParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface FindCustomerParams {
  cifNumber?: string | null;
  nationalCode?: string | null;
}

export interface FindCustomerFromTsiParams {
  personcode?: string | null;
  persontype?: number;
}
