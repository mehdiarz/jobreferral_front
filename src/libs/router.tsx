import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { lazy } from "react";

import { ErrorPage } from "../baseComponents/ErrorPage";
import { SuspenseLoading } from "../baseComponents/SuspenseLoading";
import AuthLayout from "../layout/Login/LoginLayout";
import { authStore, authActions } from "./store/authActions";
import LogoImage from "../assets/images/Logo.svg";
import { requirePermission } from "./permissions";
import { defaultMenuItems } from "../_shared/init.config";
import AccessStatusPage from "../baseComponents/AccessStatusPage";

/**
 * تابع کمکی برای چک کردن وضعیت احراز هویت
 * این تابع را در beforeLoad روت‌هایی که نیاز به لاگین دارند استفاده می‌کنیم.
 */
const checkAuth = () => {
  const { isAuthenticated } = authStore.state;
  const token = localStorage.getItem("auth_token");

  if (!token && !isAuthenticated) {
    throw redirect({
      to: "/login",
    });
  }

  // اگر توکن هست ولی استور آپدیت نیست (مثلاً بعد از رفرش)، استور را سینک کن
  if (token && !isAuthenticated) {
    authActions.initializeFromStorage();
  }
};

type PermissionNode = {
  path?: unknown;
  permissions?: unknown;
  children?: unknown;
};

const findMenuPermissions = (
  items: readonly unknown[],
  path: string,
): string[] | undefined => {
  for (const rawItem of items) {
    const item = (rawItem ?? {}) as PermissionNode;
    const itemPath =
      typeof item.path === "string" ? item.path.replace(/\/+$/, "") : "";
    const currentPath = path.replace(/\/+$/, "") || "/";
    if (
      itemPath &&
      (itemPath === currentPath || currentPath.endsWith(itemPath)) &&
      Array.isArray(item.permissions)
    ) {
      return item.permissions.filter(
        (permission): permission is string => typeof permission === "string",
      );
    }
    if (Array.isArray(item.children)) {
      const found = findMenuPermissions(item.children, path);
      if (found) return found;
    }
  }
  return undefined;
};

const requirePermissionForPath = (path: string) => {
  // TanStack Router supplies the pathname without the configured basepath in
  // normal browser navigation. The fallback also supports deployments where
  // the basepath is included.
  const permissions = findMenuPermissions(defaultMenuItems, path);
  if (permissions) requirePermission(permissions);
};

// ----------------------------------------
// Root Route
// ----------------------------------------
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </>
  ),
  errorComponent: ({ error }) => {
    console.error("Router error:", error);
    return <ErrorPage error={error} />;
  },
  notFoundComponent: () => <AccessStatusPage status={404} />,
});

// ----------------------------------------
// Index Route
// ----------------------------------------
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { isAuthenticated } = authStore.state;
    const token = localStorage.getItem("auth_token");
    throw redirect({ to: isAuthenticated || token ? "/dashboard" : "/login" });
  },
});

// ----------------------------------------
// Login Route
// ----------------------------------------
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: () => {
    // اگر کاربر لاگین است، اجازه نده دوباره به صفحه لاگین برود
    const token = localStorage.getItem("auth_token");
    if (token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => {
    const LoginForm = lazy(() => import("../Features/Login/LoginPage"));
    return (
      <SuspenseLoading>
        <AuthLayout>
          <div className="mx-auto mb-6">
            <img src={LogoImage} className="w-40" alt="Logo" />
          </div>
          <LoginForm />
        </AuthLayout>
      </SuspenseLoading>
    );
  },
});

const forbiddenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/403",
  component: () => <AccessStatusPage status={403} />,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/404",
  component: () => <AccessStatusPage status={404} />,
});

// ----------------------------------------
// Dashboard Layout Route (حامل منطق Auth)
// ----------------------------------------
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: ({ location }) => {
    checkAuth();
    requirePermissionForPath(location.pathname);
  }, // احراز هویت و مجوز قبل از لود هر زیرمجموعه
  component: () => {
    const DashboardLayout = lazy(
      () => import("../layout/dashboard/DashboardLayout"),
    );
    return (
      <SuspenseLoading>
        <DashboardLayout />
      </SuspenseLoading>
    );
  },
  notFoundComponent: () => <AccessStatusPage status={404} />,
});

// ----------------------------------------
// Dashboard Sub-Routes
// ----------------------------------------
const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: () => {
    const DashboardPage = lazy(
      () => import("../Features/Dashboard/DashboardPage"),
    );
    return (
      <SuspenseLoading>
        <DashboardPage />
      </SuspenseLoading>
    );
  },
});

const createUserRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/users/create-page",
  component: () => {
    const CreateUserPage = lazy(
      () => import("../Features/Users/CreateUserPage"),
    );
    return (
      <SuspenseLoading>
        <CreateUserPage />
      </SuspenseLoading>
    );
  },
});

const rolesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/users/roles",
  component: () => {
    const RolesPage = lazy(() => import("../Features/Users/RolesPage"));
    return (
      <SuspenseLoading>
        <RolesPage />
      </SuspenseLoading>
    );
  },
});

// --- Base Info Routes ---
const expertsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/experts",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/ExpertsPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const expertiseZonesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/expertise-zones",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/ExpertiseZonesPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/regions",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/RegionsPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const requestTypesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/request-types",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/RequestTypesPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const attachmentTypesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/attachment-types",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/AttachmentTypesPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

// const customersRoute = createRoute({
//   getParentRoute: () => dashboardLayoutRoute,
//   path: "/base-info/customers",
//   component: () => {
//     const Page = lazy(() => import("../Features/BaseInfo/CustomersPage"));
//     return (
//       <SuspenseLoading>
//         <Page />
//       </SuspenseLoading>
//     );
//   },
// });

const collateralTypesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/collateral-types",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/CollateralTypesPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const creditLimitAuthoritiesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/credit-limit-authorities",
  component: () => {
    const Page = lazy(
      () => import("../Features/BaseInfo/CreditLimitAuthoritiesPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const departmentTypeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/department-types",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/DepartmentTypePage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const departmentGradeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/department-grades",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/DepartmentGradePage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

// const departmentRoute = createRoute({
//   getParentRoute: () => dashboardLayoutRoute,
//   path: "/base-info/departments",
//   component: () => {
//     const Page = lazy(() => import("../Features/BaseInfo/DepartmentPage"));
//     return (
//       <SuspenseLoading>
//         <Page />
//       </SuspenseLoading>
//     );
//   },
// });

const personTypeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/person-types",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/PersonTypePage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const FeeRegulationPage = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/fee-regulation",
  component: () => {
    const Page = lazy(
      () => import("../Features/BaseInfo/FeeRegulationPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const requestViewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/branch/view",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Branch/RequestViewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const independentBranchRequestViewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/independent/view",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/IndependentBranch/RequestViewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const independentBranchRequestCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/independent/create",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/IndependentBranch/RequestCreatePage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const independentBranchRequestReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/independent/review",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/IndependentBranch/RequestReviewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const independentBranchRequestAssetReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/independent/asset-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/IndependentBranch/RequestAssetReviewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const independentBranchRequestRequestReferralRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/independent/referral",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/IndependentBranch/RequestReferralPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const independentreferredToExpertRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/independent/referred-to-expert",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/IndependentBranch/ReferredToExpertPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const independentRequestFeeCalculationRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/independent/fee-calculation",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/IndependentBranch/RequestFeeCalculationPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionRequestViewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/view",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Region/RequestViewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionRequestAssetReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/asset-review",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Region/RequestAssetReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionRequestReviewPageRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/review",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Region/RegionRequestReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionRequestReferralRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/referral",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Region/RequestReferralPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionEngineeringExpertViewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/engineering-expert-view",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/Region/RegionEngineeringExpertViewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionEngineeringExpertReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/engineering-expert-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/Region/RegionEngineeringExpertReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionEngineeringRepresentativeReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/engineering-representative-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/Region/RegionEngineeringRepresentativeReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionManagerApprovalRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/manager-approval",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Region/RegionManagerApprovalPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionDescriptionReferralRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/description",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/Region/RegionDescriptionReferralPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const regionreferredToExpertRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/region/referred-to-expert",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Region/ReferredToExpertPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestViewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/view",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/MainOffice/RequestViewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestEngineeringManagementReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/engineering-management-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/MainOffice/EngineeringManagementReviewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestRealEstateDepartmentHeadReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/real-estate-department-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/MainOffice/RealEstateDepartmentHeadReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestRealEstateCircleHeadReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/real-estate-unit-manager-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/MainOffice/RealEstateCircleHeadReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestRealEstateExpertReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/real-estate-expert-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/MainOffice/RealEstateExpertReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestEngineeringManagementApprovalRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/engineering-management-approval",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/MainOffice/EngineeringManagementApprovalPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestAssetReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/asset-review",
  component: () => {
    const Page = lazy(
      () =>
        import("../Features/Requests/MainOffice/RequestAssetReviewPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeRequestReferralRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/referral",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/MainOffice/RequestReferralPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const mainOfficeReferredToExpertRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/main-office/referred-to-expert",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/MainOffice/ReferredToExpertPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const requestCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/branch/create",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Branch/RequestCreatePage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const requestReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/branch/review",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Branch/RequestReviewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const requestAssetReviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/branch/asset-review",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Branch/RequestAssetReviewPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const requestReferralRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/branch/referral",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Branch/RequestReferralPage"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const requestFeeCalculationRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/branch/fee-calculation",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Branch/RequestFeeCalculationPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const referredToExpertPageRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/requests/branch/referred-to-expert",
  component: () => {
    const Page = lazy(
      () => import("../Features/Requests/Branch/ReferredToExpertPage.tsx"),
    );
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

const profileRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/profile",
  component: () => {
    const Page = lazy(() => import("../Features/Users/ProfilePage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});
// ----------------------------------------
// Route Tree
// ----------------------------------------
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  forbiddenRoute,
  notFoundRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    createUserRoute,
    rolesRoute,
    profileRoute,
    expertsRoute,
    expertiseZonesRoute,
    regionsRoute,
    requestTypesRoute,
    attachmentTypesRoute,
    // customersRoute,
    collateralTypesRoute,
    creditLimitAuthoritiesRoute,
    departmentTypeRoute,
    departmentGradeRoute,
    // departmentRoute,
    personTypeRoute,
    FeeRegulationPage,
    requestViewRoute,
    independentBranchRequestViewRoute,
    independentBranchRequestCreateRoute,
    independentBranchRequestReviewRoute,
    independentBranchRequestAssetReviewRoute,
    independentBranchRequestRequestReferralRoute,
    independentreferredToExpertRoute,
    regionRequestViewRoute,
    regionRequestAssetReviewRoute,
    regionRequestReviewPageRoute,
    regionRequestReferralRoute,
    regionEngineeringExpertViewRoute,
    regionEngineeringExpertReviewRoute,
    regionEngineeringRepresentativeReviewRoute,
    regionManagerApprovalRoute,
    regionDescriptionReferralRoute,
    regionreferredToExpertRoute,
    mainOfficeRequestViewRoute,
    mainOfficeRequestEngineeringManagementReviewRoute,
    mainOfficeRequestRealEstateDepartmentHeadReviewRoute,
    mainOfficeRequestRealEstateCircleHeadReviewRoute,
    mainOfficeRequestRealEstateExpertReviewRoute,
    mainOfficeRequestEngineeringManagementApprovalRoute,
    mainOfficeRequestAssetReviewRoute,
    mainOfficeRequestReferralRoute,
    mainOfficeReferredToExpertRoute,
    requestCreateRoute,
    requestReviewRoute,
    requestAssetReviewRoute,
    requestReferralRoute,
    requestFeeCalculationRoute,
    referredToExpertPageRoute,
    independentRequestFeeCalculationRoute,
  ]),
]);

// ----------------------------------------
// Create Router
// ----------------------------------------
export function createAppRouter(basepath = "/") {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    basepath,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
