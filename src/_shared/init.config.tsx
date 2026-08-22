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
  Pages_DepartmentTypes: "Pages.DepartmentTypes",
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
      // {
      //   id: "customers",
      //   title: "لیست مشتریان",
      //   path: "/dashboard/base-info/customers",
      //   permissions: [Permissions.Pages_Customers],
      // },
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
        id: "department-types",
        title: "انواع دپارتمان",
        path: "/dashboard/base-info/department-types",
        permissions: [Permissions.Pages_DepartmentTypes],
      },
      // {
      //   id: "departments",
      //   title: "دپارتمان‌ها",
      //   path: "/dashboard/base-info/departments",
      //   permissions: [Permissions.Pages_Departments],
      // },
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
      {
        id: "branch",
        title: "شعبه",
        icon: "building",
        children: [
          {
            id: "requests-view",
            title: "مشاهده و پیگیری درخواست‌ها",
            path: "/dashboard/requests/branch/view",
            permissions: [],
          },
          {
            id: "requests-create",
            title: "ایجاد درخواست جدید",
            path: "/dashboard/requests/branch/create",
            permissions: [],
          },
          {
            id: "requests-branch-review",
            title: "بررسی درخواست توسط شعبه",
            path: "/dashboard/requests/branch/review",
            permissions: [],
          },
          {
            id: "requests-asset-review",
            title: "بررسی و بازنگری اطلاعات ملک توسط شعبه",
            path: "/dashboard/requests/branch/asset-review",
            permissions: [],
          },
          {
            id: "requests-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/branch/referral",
            permissions: [],
          },
          {
            id: "requests-fee-calculation",
            title: "محاسبه کارمزد کارشناس رسمی دادگستری",
            path: "/dashboard/requests/branch/fee-calculation",
            permissions: [],
          },
        ],
      },
      {
        id: "independent-branch",
        title: "شعبه مستقل",
        children: [
          {
            id: "requests-independent-view",
            title: "مشاهده و پیگیری درخواست‌ها",
            path: "/dashboard/requests/independent/view",
            permissions: [],
          },
          {
            id: "requests-independent-create",
            title: "ایجاد درخواست جدید",
            path: "/dashboard/requests/independent/create",
            permissions: [],
          },
          {
            id: "requests-independent-review",
            title: "بررسی درخواست توسط شعبه مستقل",
            path: "/dashboard/requests/independent/review",
            permissions: [],
          },
          {
            id: "requests-independent-asset-review",
            title: "بازنگری اطلاعات ملک توسط شعبه مستقل",
            path: "/dashboard/requests/independent/asset-review",
            permissions: [],
          },
          {
            id: "requests-independent-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/independent/referral",
            permissions: [],
          },
          {
            id: "requests-independent-fee-calculation",
            title: "محاسبه کارمزد کارشناس رسمی دادگستری",
            path: "/dashboard/requests/independent/fee-calculation",
            permissions: [],
          },
        ],
      },
      {
        id: "region",
        title: "منطقه",
        icon: "map-marker",
        children: [
          {
            id: "requests-region-view",
            title: "مشاهده و پیگیری درخواست‌ها",
            path: "/dashboard/requests/region/view",
            permissions: [],
          },
          {
            id: "requests-region-review",
            title: "کارتابل منطقه",
            path: "/dashboard/requests/region/review",
            permissions: [],
          },
          {
            id: "requests-region-asset-review",
            title: "بررسی و بازنگری اطلاعات ملک توسط منطقه",
            path: "/dashboard/requests/region/asset-review",
            permissions: [],
          },
          {
            id: "requests-region-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/region/referral",
            permissions: [],
          },
          {
            id: "requests-region-engineering-expert-view",
            title: "کارتابل کارشناس مهندسی",
            path: "/dashboard/requests/region/engineering-expert-view",
            permissions: [],
          },
          {
            id: "requests-region-engineering-expert-review",
            title: "بررسی و امضا ملک توسط کارشناس مهندسی",
            path: "/dashboard/requests/region/engineering-expert-review",
            permissions: [],
          },
          {
            id: "requests-region-engineering-representative-review",
            title: "بررسی توسط نماینده دایره مهندسی",
            path: "/dashboard/requests/region/engineering-representative-review",
            permissions: [],
          },
          {
            id: "requests-region-manager-approval",
            title: "بررسی و امضا توسط مدیر منطقه",
            path: "/dashboard/requests/region/manager-approval",
            permissions: [],
          },
          {
            id: "requests-region-description",
            title: "درج توضیحات و ارجاع به شعبه",
            path: "/dashboard/requests/region/description",
            permissions: [],
          },
        ],
      },
      {
        id: "main-office",
        title: "ستاد",
        icon: "building",
        children: [
          {
            id: "requests-main-office-view",
            title: "مشاهده و پیگیری درخواست‌ها",
            path: "/dashboard/requests/main-office/view",
            permissions: [],
          },
          {
            id: "requests-main-office-engineering-management-review",
            title: "بررسی و ارجاع توسط مدیریت مهندسی و پشتیبانی",
            path: "/dashboard/requests/main-office/engineering-management-review",
            permissions: [],
          },
          {
            id: "requests-main-office-real-estate-department-review",
            title: "بررسی توسط ریاست اداره املاک",
            path: "/dashboard/requests/main-office/real-estate-department-review",
            permissions: [],
          },
          {
            id: "requests-main-office-real-estate-unit-manager-review",
            title: "بررسی توسط رئیس دایره املاک",
            path: "/dashboard/requests/main-office/real-estate-unit-manager-review",
            permissions: [],
          },
          {
            id: "requests-main-office-real-estate-expert-review",
            title: "بررسی توسط کارشناس املاک",
            path: "/dashboard/requests/main-office/real-estate-expert-review",
            permissions: [],
          },
          {
            id: "requests-main-office-asset-review",
            title: "بررسی و بازنگری اطلاعات ملک توسط ستاد",
            path: "/dashboard/requests/main-office/asset-review",
            permissions: [],
          },
          {
            id: "requests-main-office-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/main-office/referral",
            permissions: [],
          },
          {
            id: "requests-main-office-engineering-management-approval",
            title: "بررسی و امضا توسط مدیریت مهندسی و پشتیبانی",
            path: "/dashboard/requests/main-office/engineering-management-approval",
            permissions: [],
          },
        ],
      },
    ],
  },
];
