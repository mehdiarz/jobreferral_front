import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  isRedirect,
  isNotFound,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { lazy, type ReactNode, useEffect } from "react";

import { ErrorPage } from "../baseComponents/ErrorPage";
import { SuspenseLoading } from "../baseComponents/SuspenseLoading";
import { useAuthStore } from "./store";
import AuthLayout from "../layout/Login/LoginLayout";
import { authStore, authActions } from "./store/authActions";

// ----------------------------------------
// Auth Guard
// ----------------------------------------
const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  const token = localStorage.getItem("auth_token");
  const hasToken = !!token;

  useEffect(() => {
    if (hasToken && !isAuthenticated) {
      authActions.initializeFromStorage();
    }
  }, [hasToken, isAuthenticated]);

  if (!hasToken && !isAuthenticated) {
    throw redirect({ to: "/login" });
  }

  return <>{children}</>;
};

// ----------------------------------------
// Lazy imports
// ----------------------------------------
const DashboardLayout = lazy(
  () => import("../layout/dashboard/DashboardLayout"),
);
const DashboardPage = lazy(() => import("../Features/Dashboard/DashboardPage"));
const CreateUserPage = lazy(() => import("../Features/Users/CreateUserPage"));
const RolesPage = lazy(() => import("../Features/Users/RolesPage"));
const ExpertsPage = lazy(() => import("../Features/BaseInfo/ExpertsPage"));
const ExpertiseZonesPage = lazy(
  () => import("../Features/BaseInfo/ExpertiseZonesPage"),
);
const RegionsPage = lazy(() => import("../Features/BaseInfo/RegionsPage"));
const RequestTypesPage = lazy(
  () => import("../Features/BaseInfo/RequestTypesPage"),
);
const AttachmentTypesPage = lazy(
  () => import("../Features/BaseInfo/AttachmentTypesPage"),
);
const CustomersPage = lazy(() => import("../Features/BaseInfo/CustomersPage"));
const CollateralTypesPage = lazy(
  () => import("../Features/BaseInfo/CollateralTypesPage"),
);
const CreditLimitAuthoritiesPage = lazy(
  () => import("../Features/BaseInfo/CreditLimitAuthoritiesPage"),
);
const DepartmentGradePage = lazy(
  () => import("../Features/BaseInfo/DepartmentGradePage"),
);
const DepartmentPage = lazy(
  () => import("../Features/BaseInfo/DepartmentPage"),
);
const PersonTypePage = lazy(
  () => import("../Features/BaseInfo/PersonTypePage"),
);

// ----------------------------------------
// Helpers
// ----------------------------------------
const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return "خطای ناشناخته در مسیریابی";
};

const getSafeErrorStack = (error: unknown): string | undefined => {
  if (error instanceof Error && typeof error.stack === "string")
    return error.stack;
  return undefined;
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
    if (isRedirect(error)) return null;
    if (isNotFound(error))
      return <ErrorPage error={new Error("صفحه مورد نظر یافت نشد")} />;

    const safeMessage = getSafeErrorMessage(error);
    const safeStack = getSafeErrorStack(error);
    const safeError = new Error(safeMessage);
    if (safeStack) safeError.stack = safeStack;
    console.error("Router error:", safeMessage);

    return <ErrorPage error={safeError} />;
  },
});

// ----------------------------------------
// Index Route (redirect to dashboard or login)
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
const LoginForm = lazy(() => import("../Features/Login/LoginPage"));
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => (
    <SuspenseLoading>
      <AuthLayout>
        <div className="mx-auto mb-6">
          <img src="./images/Logo.svg" className="w-40" />
        </div>
        <LoginForm />
      </AuthLayout>
    </SuspenseLoading>
  ),
});

// ----------------------------------------
// Dashboard (Protected)
// ----------------------------------------
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <AuthGuard>
      <SuspenseLoading>
        <DashboardLayout />
      </SuspenseLoading>
    </AuthGuard>
  ),
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: () => (
    <SuspenseLoading>
      <DashboardPage />
    </SuspenseLoading>
  ),
});

// Users
const createUserRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/users/create-page",
  component: () => (
    <SuspenseLoading>
      <CreateUserPage />
    </SuspenseLoading>
  ),
});

const rolesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/users/roles",
  component: () => (
    <SuspenseLoading>
      <RolesPage />
    </SuspenseLoading>
  ),
});

// Base Info
const expertsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/experts",
  component: () => (
    <SuspenseLoading>
      <ExpertsPage />
    </SuspenseLoading>
  ),
});

const expertiseZonesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/expertise-zones",
  component: () => (
    <SuspenseLoading>
      <ExpertiseZonesPage />
    </SuspenseLoading>
  ),
});

const regionsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/regions",
  component: () => (
    <SuspenseLoading>
      <RegionsPage />
    </SuspenseLoading>
  ),
});

const requestTypesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/request-types",
  component: () => (
    <SuspenseLoading>
      <RequestTypesPage />
    </SuspenseLoading>
  ),
});

const attachmentTypesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/attachment-types",
  component: () => (
    <SuspenseLoading>
      <AttachmentTypesPage />
    </SuspenseLoading>
  ),
});

const customersRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/customers",
  component: () => (
    <SuspenseLoading>
      <CustomersPage />
    </SuspenseLoading>
  ),
});

const collateralTypesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/collateral-types",
  component: () => (
    <SuspenseLoading>
      <CollateralTypesPage />
    </SuspenseLoading>
  ),
});

const creditLimitAuthoritiesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/credit-limit-authorities",
  component: () => (
    <SuspenseLoading>
      <CreditLimitAuthoritiesPage />
    </SuspenseLoading>
  ),
});

const departmentGradeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/department-grades",
  component: () => (
    <SuspenseLoading>
      <DepartmentGradePage />
    </SuspenseLoading>
  ),
});

const departmentRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/departments",
  component: () => (
    <SuspenseLoading>
      <DepartmentPage />
    </SuspenseLoading>
  ),
});

const personTypeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/person-types",
  component: () => (
    <SuspenseLoading>
      <PersonTypePage />
    </SuspenseLoading>
  ),
});

// ----------------------------------------
// Route Tree
// ----------------------------------------
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    createUserRoute,
    rolesRoute,
    expertsRoute,
    expertiseZonesRoute,
    regionsRoute,
    requestTypesRoute,
    attachmentTypesRoute,
    customersRoute,
    collateralTypesRoute,
    creditLimitAuthoritiesRoute,
    departmentGradeRoute,
    departmentRoute,
    personTypeRoute,
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
