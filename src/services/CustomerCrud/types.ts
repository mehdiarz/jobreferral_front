export interface CustomerItem {
  id: number;
  personalTypeId?: number | null;
  cifNumber?: string | null;
  name?: string | null;
  creationTime?: string;
  lastModificationTime?: string | null;
  nationalCode?: string | null;
  isDeleted?: boolean;
  deletionTime?: string | null;
}

export interface CreateCustomerBody {
  personalTypeId: number;
  cifNumber: string;
  name: string;
}

export interface EditCustomerBody {
  id: number;
  personalTypeId: number;
  cifNumber: string;
  name: string;
}

export interface GetAllCustomersParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface FindCustomerResponse {
  result: {
    customers: CustomerItem[];
  };
  success: boolean;
}
