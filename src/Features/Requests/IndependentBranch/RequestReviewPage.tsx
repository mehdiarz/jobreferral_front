import { DepartmentRequestReviewPage } from "../Branch/RequestReviewPage";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";

export default function IndependentBranchRequestReviewPage() {
  return (
    <DepartmentRequestReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.independentBranch}
    />
  );
}
