import { DepartmentRegionEngineeringExpertViewPage } from "./RegionEngineeringExpertViewPage";
import { REQUEST_DEPARTMENT_TYPES } from "../requestDepartmentTypes";
import { REQUEST_STATUS_CODES } from "../requestStatuses";

export default function RegionEngineeringExpertReviewPage() {
  return (
    <DepartmentRegionEngineeringExpertViewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.region}
      statusCode={REQUEST_STATUS_CODES.engineeringExpertReview}
    />
  );
}
