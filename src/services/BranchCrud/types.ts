export interface BranchItem {
  id: number;
  branchCode: number | null;
  branchName: string | null;
  status: number;
  regionCode: number | null;
  isDeleted: boolean;
  isCapital: boolean;
  deletionTime: string | null;
  lastModificationTime: string | null;
  creationTime: string;
}

export interface CreateBranchBody {
  branchCode?: number | null;
  branchName?: string | null;
  isCapital: boolean;
  status: number;
  regionCode?: number | null;
}

export interface EditBranchBody {
  id: number;
  branchCode?: number | null;
  branchName?: string | null;
  isCapital: boolean;
  status: number;
  regionCode?: number | null;
}

export interface GetAllBranchesParams {
  regionCode?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
