import { DepartmentReferredToExpertPage } from "../Branch/ReferredToExpertPage.tsx";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";

export default function IndependentBranchRequestViewPage() {
  return (
    <DepartmentReferredToExpertPage
      departmentType={REQUEST_DEPARTMENT_TYPES.independentBranch}
    />
  );
}
