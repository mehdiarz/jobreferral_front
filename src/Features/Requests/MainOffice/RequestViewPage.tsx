import { DepartmentRequestViewPage } from "../Branch/RequestViewPage";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";

export default function MainOfficeRequestViewPage() {
  return (
    <DepartmentRequestViewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.mainOffice}
    />
  );
}
