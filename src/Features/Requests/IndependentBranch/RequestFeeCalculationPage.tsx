import { DepartmentRequestFeeCalculationPage } from "../Branch/RequestFeeCalculationPage";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";

export default function IndependentBranchRequestFeeCalculationPage() {
  return (
    <DepartmentRequestFeeCalculationPage
      departmentType={REQUEST_DEPARTMENT_TYPES.independentBranch}
    />
  );
}
