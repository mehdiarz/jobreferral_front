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
            <img src="./images/Logo.svg" className="w-40" alt="Logo" />
          </div>
          <LoginForm />
        </AuthLayout>
      </SuspenseLoading>
    );
  },
});

// ----------------------------------------
// Dashboard Layout Route (حامل منطق Auth)
// ----------------------------------------
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => checkAuth(), // قبل از لود شدن هر زیرمجموعه‌ای، لاگین چک می‌شود
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

const customersRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/customers",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/CustomersPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

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

const departmentRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/base-info/departments",
  component: () => {
    const Page = lazy(() => import("../Features/BaseInfo/DepartmentPage"));
    return (
      <SuspenseLoading>
        <Page />
      </SuspenseLoading>
    );
  },
});

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
    requestCreateRoute,
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
