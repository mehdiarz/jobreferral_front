export interface JudicialExpertRegionInputDto {
  [key: string]: unknown;
}

export interface JudicialExpertRegionOutputDto {
  [key: string]: unknown;
}

export interface ExpertItem {
  id: number;
  firstName: string | null;
  lastName: string | null;
  code: string | null;
  rank: number;
  licenseIssueDate: string | null;
  licenseExpireDate: string | null;
  expertiseZoneId: number;
  licenseNumber: string | null;
  phoneNumber: string | null;
  mobileNumber: string | null;
  email: string | null;
  isActive: boolean;
  regions: JudicialExpertRegionOutputDto[] | null;
  creationTime: string;
  lastModificationTime: string | null;
  isDeleted: boolean;
}

export interface CreateExpertBody {
  firstName?: string | null;
  lastName?: string | null;
  code?: string | null;
  rank: number;
  expertiseZoneId: number;
  licenseNumber?: string | null;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  licenseIssueDate?: string | null;
  licenseExpireDate?: string | null;
  isActive: boolean;
  regions?: JudicialExpertRegionInputDto[] | null;
}

export interface EditExpertBody extends CreateExpertBody {
  id: number;
}

export interface GetAllExpertsParams {
  firstName?: string;
  lastName?: string;
  code?: string;
  expertiseZoneTitle?: string;
  licenseNumber?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface GetAllExpertsResponse {
  items: ExpertItem[];
  totalCount: number;
}
