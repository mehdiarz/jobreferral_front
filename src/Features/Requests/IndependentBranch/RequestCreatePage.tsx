import { DepartmentRequestCreatePage } from "../Branch/RequestCreatePage";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";

export default function IndependentBranchRequestCreatePage() {
  return (
    <DepartmentRequestCreatePage
      departmentType={REQUEST_DEPARTMENT_TYPES.independentBranch}
    />
  );
}
