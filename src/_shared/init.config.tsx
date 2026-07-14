export const Permissions = {
    Pages_Users: "Pages.Users",
    Pages_Roles: "Pages.Roles",
    Pages_BaseInfo: "Pages.BaseInfo",
    // پرمیشن‌های احتمالی برای هر بخش از اطلاعات پایه
    Pages_Experts: "Pages.BaseInfo.Experts",
    Pages_ExpertiseZones: "Pages.BaseInfo.ExpertiseZones",
    Pages_Regions: "Pages.BaseInfo.Regions",
    Pages_RequestTypes: "Pages.BaseInfo.RequestTypes",
    Pages_AttachmentTypes: "Pages.BaseInfo.AttachmentTypes",
    Pages_Customers: "Pages.BaseInfo.Customers",
    Pages_CollateralTypes: "Pages.BaseInfo.CollateralTypes",
    Pages_CreditLimitAuthorities: "Pages.BaseInfo.CreditLimitAuthorities",
} as const;

export type PermissionName = (typeof Permissions)[keyof typeof Permissions];

export const ALL_PERMISSIONS: string[] = Object.values(Permissions);

export const defaultMenuItems = [
    {
        id: "home",
        title: "خانه",
        icon: "home",
        path: "/dashboard",
        children: []
    },
    {
        id: "user-mgmt",
        title: "مدیریت کاربران",
        icon: "users",
        children: [
            { id: "users-list", title: "لیست کاربران", path: "/dashboard/users/create-page" },
            { id: "roles", title: "مدیریت نقش‌ها", path: "/dashboard/users/roles" }
        ]
    },
    {
        id: "base-info",
        title: "اطلاعات پایه",
        icon: "database",
        children: [
            { id: "experts", title: "ثبت کارشناسان دادگستری", path: "/dashboard/base-info/experts" },
            { id: "expertise-zones", title: "حدود صلاحیت کارشناس", path: "/dashboard/base-info/expertise-zones" },
            { id: "regions", title: "ثبت منطقه استانی", path: "/dashboard/base-info/regions" },
            { id: "request-types", title: "ثبت نوع درخواست", path: "/dashboard/base-info/request-types" },
            { id: "attachment-types", title: "ثبت نوع مدارک پیوست", path: "/dashboard/base-info/attachment-types" },
            { id: "customers", title: "لیست مشتریان", path: "/dashboard/base-info/customers" },
            { id: "collateral-types", title: "ثبت نوع وثیقه", path: "/dashboard/base-info/collateral-types" },
            { id: "credit-limits", title: "ثبت حدود اختیارات", path: "/dashboard/base-info/credit-limit-authorities" },
        ]
    },
    {
        id: "requests",
        title: "مدیریت درخواست‌ها",
        icon: "clipboard-list",
        children: [
            { id: "independent-branch", title: "شعبه مستقل", path: "#" },
            { id: "branch", title: "شعبه", path: "#" },
        ]
    }
];