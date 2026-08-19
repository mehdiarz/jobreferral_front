import { DepartmentRequestAssetReviewPage } from "../Branch/RequestAssetReviewPage";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";

export default function IndependentBranchRequestAssetReviewPage() {
  return (
    <DepartmentRequestAssetReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.independentBranch}
    />
  );
}
