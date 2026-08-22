import { DepartmentRequestReferralPage } from "../Branch/RequestReferralPage";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";

export default function IndependentBranchRequestReferralPage() {
  return (
    <DepartmentRequestReferralPage
      departmentType={REQUEST_DEPARTMENT_TYPES.region}
    />
  );
}
