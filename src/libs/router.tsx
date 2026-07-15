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
import { lazy } from "react";

import { ErrorPage } from "../baseComponents/ErrorPage";
import { SuspenseLoading } from "../baseComponents/SuspenseLoading";

const DashboardLayout = lazy(() => import("../layout/dashboard/DashboardLayout"));
const DashboardPage = lazy(() => import("../Features/Dashboard/DashboardPage"));
const CreateUserPage = lazy(() => import("../Features/Users/CreateUserPage"));
const RolesPage = lazy(() => import("../Features/Users/RolesPage"));

const ExpertsPage = lazy(() => import("../Features/BaseInfo/ExpertsPage"));
const ExpertiseZonesPage = lazy(() => import("../Features/BaseInfo/ExpertiseZonesPage"));
const RegionsPage = lazy(() => import("../Features/BaseInfo/RegionsPage"));
const RequestTypesPage = lazy(() => import("../Features/BaseInfo/RequestTypesPage"));
const AttachmentTypesPage = lazy(() => import("../Features/BaseInfo/AttachmentTypesPage"));
const CustomersPage = lazy(() => import("../Features/BaseInfo/CustomersPage"));
const CollateralTypesPage = lazy(() => import("../Features/BaseInfo/CollateralTypesPage"));
const CreditLimitAuthoritiesPage = lazy(
    () => import("../Features/BaseInfo/CreditLimitAuthoritiesPage"),
);
const DepartmentGradePage = lazy(() => import("../Features/BaseInfo/DepartmentGradePage"));
const DepartmentPage = lazy(() => import("../Features/BaseInfo/DepartmentPage"));

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
    if (error instanceof Error && typeof error.stack === "string") {
        return error.stack;
    }
    return undefined;
};

const rootRoute = createRootRoute({
    component: () => (
        <>
            <Outlet />
            {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
        </>
    ),
    errorComponent: ({ error }) => {
        if (isRedirect(error)) {
            return null;
        }

        if (isNotFound(error)) {
            return <ErrorPage error={new Error("صفحه مورد نظر یافت نشد")} />;
        }

        const safeMessage = getSafeErrorMessage(error);
        const safeStack = getSafeErrorStack(error);
        const safeError = new Error(safeMessage);

        if (safeStack) {
            safeError.stack = safeStack;
        }

        console.error("Router error:", safeMessage);

        return <ErrorPage error={safeError} />;
    },
});

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    beforeLoad: () => {
        throw redirect({
            to: "/dashboard",
        });
    },
});

export const dashboardLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard",
    component: () => (
        <SuspenseLoading>
            <DashboardLayout />
        </SuspenseLoading>
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
    )
});

const departmentRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/base-info/departments",
    component: () => (
        <SuspenseLoading>
            <DepartmentPage />
        </SuspenseLoading>
    )
});


const routeTree = rootRoute.addChildren([
    indexRoute,
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
        departmentRoute
    ]),
]);

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
