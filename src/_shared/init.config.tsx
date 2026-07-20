export const Permissions = {
  Pages_Users: "Pages.Users",
  Pages_Roles: "Pages.Roles",
  Pages_BaseInfo: "Pages.BaseInfo",

  Pages_Experts: "Pages.JudicialExperts",
  Pages_ExpertiseZones: "Pages.ExpertiseZones",
  Pages_Regions: "Pages.Regions",
  Pages_RequestTypes: "Pages.RequestTypes",
  Pages_AttachmentTypes: "Pages.DocumentTypes",
  Pages_Customers: "Pages.Customers",
  Pages_CollateralTypes: "Pages.CollatralTypes",
  Pages_CreditLimitAuthorities: "Pages.CreditLimitAuthorities",
  Pages_DepartmentGrades: "Pages.DepartmentGrades",
  Pages_Departments: "Pages.Departments",
  Pages_PersonTypes: "Pages.PersonTypes",
} as const;

export type PermissionName = (typeof Permissions)[keyof typeof Permissions];

export const ALL_PERMISSIONS: string[] = Object.values(Permissions);

export const defaultMenuItems = [
  {
    id: "home",
    title: "خانه",
    icon: "home",
    path: "/dashboard",
    children: [],
  },
  {
    id: "user-mgmt",
    title: "مدیریت کاربران",
    icon: "users",
    children: [
      {
        id: "users-list",
        title: "لیست کاربران",
        path: "/dashboard/users/create-page",
        permissions: [Permissions.Pages_Users],
      },
      {
        id: "roles",
        title: "مدیریت نقش‌ها",
        path: "/dashboard/users/roles",
        permissions: [Permissions.Pages_Roles],
      },
    ],
  },
  {
    id: "base-info",
    title: "اطلاعات پایه",
    icon: "database",
    children: [
      {
        id: "experts",
        title: "ثبت کارشناسان دادگستری",
        path: "/dashboard/base-info/experts",
        permissions: [Permissions.Pages_Experts],
      },
      {
        id: "expertise-zones",
        title: "حدود صلاحیت کارشناس",
        path: "/dashboard/base-info/expertise-zones",
        permissions: [Permissions.Pages_ExpertiseZones],
      },
      {
        id: "regions",
        title: "ثبت منطقه استانی",
        path: "/dashboard/base-info/regions",
        permissions: [Permissions.Pages_Regions],
      },
      {
        id: "request-types",
        title: "ثبت نوع درخواست",
        path: "/dashboard/base-info/request-types",
        permissions: [Permissions.Pages_RequestTypes],
      },
      {
        id: "attachment-types",
        title: "ثبت نوع مدارک پیوست",
        path: "/dashboard/base-info/attachment-types",
        permissions: [Permissions.Pages_AttachmentTypes],
      },
      {
        id: "customers",
        title: "لیست مشتریان",
        path: "/dashboard/base-info/customers",
        permissions: [Permissions.Pages_Customers],
      },
      {
        id: "collateral-types",
        title: "ثبت نوع وثیقه",
        path: "/dashboard/base-info/collateral-types",
        permissions: [Permissions.Pages_CollateralTypes],
      },
      {
        id: "department-grades",
        title: "رتبه‌های دپارتمان",
        path: "/dashboard/base-info/department-grades",
        permissions: [Permissions.Pages_DepartmentGrades],
      },
      {
        id: "departments",
        title: "دپارتمان‌ها",
        path: "/dashboard/base-info/departments",
        permissions: [Permissions.Pages_Departments],
      },
      {
        id: "person-types",
        title: "انواع شخص",
        path: "/dashboard/base-info/person-types",
        permissions: [Permissions.Pages_PersonTypes],
      },
      {
        id: "credit-limits",
        title: "ثبت حدود اختیارات",
        path: "/dashboard/base-info/credit-limit-authorities",
        permissions: [Permissions.Pages_CreditLimitAuthorities],
      },
    ],
  },
  {
    id: "requests",
    title: "مدیریت درخواست‌ها",
    icon: "clipboard-list",
    children: [
      { id: "independent-branch", title: "شعبه مستقل", path: "#" },
      { id: "branch", title: "شعبه", path: "#" },
      { id: "region", title: "منطقه", path: "#" },
      { id: "main-office", title: "ستاد", path: "#" },
    ],
  },
];
