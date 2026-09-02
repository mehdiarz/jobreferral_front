import { getBasePath } from "../../libs/appConfig";
import { getStoredPermissions, hasAnyPermission } from "../../libs/permissions";
import { Permissions } from "../../_shared/init.config";
import type { RequestDepartmentTypeConfig } from "./requestDepartmentTypes";
import type { UserActionResult } from "../../services/RequestCrud/userAction";

type NextStep = { path: string; permission: string };
const step = (path: string, permission: string): NextStep => ({ path, permission });

const stepsByDepartment: Record<number, Record<number, NextStep>> = {
  1: {
    2: step("/dashboard/requests/branch/review", Permissions.Pages_Branch_RequestsBranchReview),
    4: step("/dashboard/requests/branch/asset-review", Permissions.Pages_Branch_RequestsAssetReview),
    6: step("/dashboard/requests/branch/referred-to-expert", Permissions.Pages_Branch_ReferredToExpert),
    7: step("/dashboard/requests/branch/referral", Permissions.Pages_Branch_RequestsReferral),
    29: step("/dashboard/requests/branch/fee-calculation", Permissions.Pages_Branch_RequestsFeeCalculation),
    9: step("/dashboard/requests/branch/review", Permissions.Pages_Branch_RequestsBranchReview),
  },
  2: {
    2: step("/dashboard/requests/independent/review", Permissions.Pages_IndependentBranch_RequestsIndependentReview),
    4: step("/dashboard/requests/independent/asset-review", Permissions.Pages_IndependentBranch_RequestsIndependentAssetReview),
    6: step("/dashboard/requests/independent/referred-to-expert", Permissions.Pages_IndependentBranch_ReferredToExpert),
    7: step("/dashboard/requests/independent/referral", Permissions.Pages_IndependentBranch_RequestsIndependentReferral),
    29: step("/dashboard/requests/independent/fee-calculation", Permissions.Pages_IndependentBranch_RequestsIndependentFeeCalculation),
    9: step("/dashboard/requests/independent/review", Permissions.Pages_IndependentBranch_RequestsIndependentReview),
  },
  3: {
    4: step("/dashboard/requests/region/asset-review", Permissions.Pages_Region_RequestsRegionAssetReview),
    6: step("/dashboard/requests/region/referred-to-expert", Permissions.Pages_Region_ReferredToExpert),
    7: step("/dashboard/requests/region/referral", Permissions.Pages_Region_RequestsRegionReferral),
    10: step("/dashboard/requests/region/engineering-expert-view", Permissions.Pages_Region_RequestsRegionEngineeringExpertView),
    11: step("/dashboard/requests/region/engineering-expert-review", Permissions.Pages_Region_RequestsRegionEngineeringExpertReview),
    13: step("/dashboard/requests/region/engineering-representative-review", Permissions.Pages_Region_RequestsRegionEngineeringRepresentativeReview),
    15: step("/dashboard/requests/region/manager-approval", Permissions.Pages_Region_RequestsRegionManagerApproval),
    17: step("/dashboard/requests/main-office/engineering-management-review", Permissions.Pages_MainOffice_RequestsMainOfficeEngineeringManagementReview),
    32: step("/dashboard/requests/region/review", Permissions.Pages_Region_RequestsRegionReview),
    34: step("/dashboard/requests/main-office/engineering-management-review", Permissions.Pages_MainOffice_RequestsMainOfficeEngineeringManagementReview),
    28: step("/dashboard/requests/branch/review", Permissions.Pages_Branch_RequestsBranchReview),
  },
  4: {
    4: step("/dashboard/requests/main-office/asset-review", Permissions.Pages_MainOffice_RequestsMainOfficeAssetReview),
    6: step("/dashboard/requests/main-office/referred-to-expert", Permissions.Pages_MainOffice_ReferredToExpert),
    7: step("/dashboard/requests/main-office/referral", Permissions.Pages_MainOffice_RequestsMainOfficeReferral),
    18: step("/dashboard/requests/main-office/real-estate-department-review", Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateDepartmentReview),
    19: step("/dashboard/requests/main-office/real-estate-unit-manager-review", Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateUnitManagerReview),
    20: step("/dashboard/requests/main-office/real-estate-expert-review", Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateExpertReview),
    27: step("/dashboard/requests/main-office/engineering-management-review", Permissions.Pages_MainOffice_RequestsMainOfficeEngineeringManagementReview),
    35: step("/dashboard/requests/main-office/engineering-management-approval", Permissions.Pages_MainOffice_RequestsMainOfficeEngineeringManagementApproval),
    117: step("/dashboard/requests/main-office/engineering-management-review", Permissions.Pages_MainOffice_RequestsMainOfficeEngineeringManagementReview),
    118: step("/dashboard/requests/main-office/real-estate-department-review", Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateDepartmentReview),
    119: step("/dashboard/requests/main-office/real-estate-unit-manager-review", Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateUnitManagerReview),
  },
};

const departmentFromPath = (pathname: string): number | undefined => {
  if (pathname.includes("/requests/independent/")) return 2;
  if (pathname.includes("/requests/region/")) return 3;
  if (pathname.includes("/requests/main-office/")) return 4;
  if (pathname.includes("/requests/branch/")) return 1;
  return undefined;
};

const withBasePath = (path: string): string => {
  if (getBasePath() !== "/") return `${getBasePath()}${path}`;
  const pathname = window.location.pathname;
  const dashboardIndex = pathname.indexOf("/dashboard");
  return dashboardIndex > 0 ? `${pathname.slice(0, dashboardIndex)}${path}` : path;
};

export function getNextRequestStep(
  action: Pick<UserActionResult, "nextStateCode"> | null | undefined,
  departmentType?: RequestDepartmentTypeConfig,
): NextStep | undefined {
  if (!action || typeof action.nextStateCode !== "number") return undefined;
  const departmentId = departmentType?.id ?? departmentFromPath(window.location.pathname);
  return departmentId ? stepsByDepartment[departmentId]?.[action.nextStateCode] : undefined;
}

export function scheduleNextRequestStep(
  action: Pick<UserActionResult, "nextStateCode"> | null | undefined,
  departmentType?: RequestDepartmentTypeConfig,
  delay = 1200,
): void {
  if (typeof window === "undefined") return;
  const nextStep = getNextRequestStep(action, departmentType);
  if (!nextStep || !hasAnyPermission(getStoredPermissions(), [nextStep.permission])) return;
  window.setTimeout(() => {
    window.location.href = withBasePath(nextStep.path);
  }, delay);
}
