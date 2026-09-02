export const Permissions = {
  // Users & Roles
  Pages_Users: "Pages.Users",
  Pages_Roles: "Pages.Roles",

  // Base Info (Cruds)
  Pages_BaseInfo_DepartmentTypes: "Pages.BaseInfo_department-types",
  Pages_BaseInfo_PersonTypes: "Pages.BaseInfo_person-types",
  Pages_BaseInfo_FeeRegulation: "Pages.BaseInfo_fee-regulation",
  Pages_BaseInfo_CreditLimits: "Pages.BaseInfo_credit-limits",
  Pages_BaseInfo_Experts: "Pages.BaseInfo_experts",
  Pages_BaseInfo_Regions: "Pages.BaseInfo_regions",
  Pages_BaseInfo_RequestTypes: "Pages.BaseInfo_request-types",
  Pages_BaseInfo_AttachmentTypes: "Pages.BaseInfo_attachment-types",
  Pages_BaseInfo_CollateralTypes: "Pages.BaseInfo_collateral-types",
  Pages_BaseInfo_ExpertiseZones: "Pages.BaseInfo_expertise-zones",
  Pages_BaseInfo_Departments: "Pages.BaseInfo_departments",
  Pages_BaseInfo_DepartmentGrades: "Pages.BaseInfo_department-grades",
  Pages_BaseInfo_Customers: "Pages.BaseInfo_customers",

  // Branch Permissions
  Pages_Branch_RequestsCreate: "Pages.Branch.requests-create",
  Pages_Branch_RequestsBranchReview: "Pages.Branch.requests-branch-review",
  Pages_Branch_RequestsAssetReview: "Pages.Branch.requests-asset-review",
  Pages_Branch_RequestsFeeCalculation: "Pages.Branch.requests-fee-calculation",
  Pages_Branch_RequestsView: "Pages.Branch.requests-view",
  Pages_Branch_RequestsReferral: "Pages.Branch.requests-referral",
  Pages_Branch_ReferredToExpert: "Pages.Branch.requests-referred-to-expert",

  // Independent Branch Permissions
  Pages_IndependentBranch_RequestsIndependentCreate:
    "Pages.IndependentBranch.requests-independent-create",
  Pages_IndependentBranch_RequestsIndependentReview:
    "Pages.IndependentBranch.requests-independent-review",
  Pages_IndependentBranch_RequestsIndependentAssetReview:
    "Pages.IndependentBranch.requests-independent-asset-review",
  Pages_IndependentBranch_RequestsIndependentFeeCalculation:
    "Pages.IndependentBranch.requests-independent-fee-calculation",
  Pages_IndependentBranch_RequestsIndependentView:
    "Pages.IndependentBranch.requests-independent-view",
  Pages_IndependentBranch_RequestsIndependentReferral:
    "Pages.IndependentBranch.requests-independent-referral",
  Pages_IndependentBranch_ReferredToExpert:
    "Pages.IndependentBranch.requests-independent-referred-to-expert",

  // Region Permissions
  Pages_Region_RequestsRegionEngineeringRepresentativeReview:
    "Pages.Region.requests-region-engineering-representative-review",
  Pages_Region_RequestsRegionManagerApproval:
    "Pages.Region.requests-region-manager-approval",
  Pages_Region_RequestsRegionEngineeringExpertReview:
    "Pages.Region.requests-region-engineering-expert-review",
  Pages_Region_RequestsRegionAssetReview:
    "Pages.Region.requests-region-asset-review",
  Pages_Region_RequestsRegionDescription:
    "Pages.Region.requests-region-description",
  Pages_Region_RequestsRegionEngineeringExpertView:
    "Pages.Region.requests-region-engineering-expert-view",
  Pages_Region_RequestsRegionReview: "Pages.Region.requests-region-review",
  Pages_Region_RequestsRegionView: "Pages.Region.requests-region-view",
  Pages_Region_RequestsRegionReferral: "Pages.Region.requests-region-referral",
  Pages_Region_ReferredToExpert:
    "Pages.Region.requests-region-referred-to-expert",

  // Main Office Permissions
  Pages_MainOffice_RequestsMainOfficeRealEstateUnitManagerReview:
    "Pages.MainOffice.requests-main-office-real-estate-unit-manager-review",
  Pages_MainOffice_RequestsMainOfficeRealEstateDepartmentReview:
    "Pages.MainOffice.requests-main-office-real-estate-department-review",
  Pages_MainOffice_RequestsMainOfficeRealEstateExpertReview:
    "Pages.MainOffice.requests-main-office-real-estate-expert-review",
  Pages_MainOffice_RequestsMainOfficeEngineeringManagementReview:
    "Pages.MainOffice.requests-main-office-engineering-management-review",
  Pages_MainOffice_RequestsMainOfficeEngineeringManagementApproval:
    "Pages.MainOffice.requests-main-office-engineering-management-approval",
  Pages_MainOffice_RequestsMainOfficeAssetReview:
    "Pages.MainOffice.requests-main-office-asset-review",
  Pages_MainOffice_RequestsMainOfficeView:
    "Pages.MainOffice.requests-main-office-view",
  Pages_MainOffice_RequestsMainOfficeReferral:
    "Pages.MainOffice.requests-main-office-referral",
  Pages_MainOffice_ReferredToExpert:
    "Pages.MainOffice.requests-main-office-referred-to-expert",
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
        permissions: [Permissions.Pages_BaseInfo_Experts],
      },
      {
        id: "expertise-zones",
        title: "حدود صلاحیت کارشناس/ ثبت نوع وثیقه",
        path: "/dashboard/base-info/expertise-zones",
        permissions: [Permissions.Pages_BaseInfo_ExpertiseZones],
      },
      {
        id: "regions",
        title: "ثبت منطقه استانی",
        path: "/dashboard/base-info/regions",
        permissions: [Permissions.Pages_BaseInfo_Regions],
      },
      {
        id: "request-types",
        title: "ثبت نوع درخواست",
        path: "/dashboard/base-info/request-types",
        permissions: [Permissions.Pages_BaseInfo_RequestTypes],
      },
      {
        id: "attachment-types",
        title: "ثبت نوع مدارک پیوست",
        path: "/dashboard/base-info/attachment-types",
        permissions: [Permissions.Pages_BaseInfo_AttachmentTypes],
      },
      // {
      //   id: "collateral-types",
      //   title: "ثبت نوع وثیقه",
      //   path: "/dashboard/base-info/collateral-types",
      //   permissions: [Permissions.Pages_BaseInfo_CollateralTypes],
      // },
      {
        id: "department-grades",
        title: "رتبه‌های دپارتمان",
        path: "/dashboard/base-info/department-grades",
        permissions: [Permissions.Pages_BaseInfo_DepartmentGrades],
      },
      {
        id: "department-types",
        title: "انواع دپارتمان",
        path: "/dashboard/base-info/department-types",
        permissions: [Permissions.Pages_BaseInfo_DepartmentTypes],
      },
      {
        id: "person-types",
        title: "انواع شخص",
        path: "/dashboard/base-info/person-types",
        permissions: [Permissions.Pages_BaseInfo_PersonTypes],
      },
      {
        id: "credit-limits",
        title: "ثبت حدود اختیارات",
        path: "/dashboard/base-info/credit-limit-authorities",
        permissions: [Permissions.Pages_BaseInfo_CreditLimits],
      },
      {
        id: "fee-regulation",
        title: "بخشنامه حق‌الزحمه",
        path: "/dashboard/base-info/fee-regulation",
        permissions: [Permissions.Pages_BaseInfo_FeeRegulation],
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
            permissions: [Permissions.Pages_Branch_RequestsView],
          },
          {
            id: "requests-create",
            title: "ایجاد درخواست جدید",
            path: "/dashboard/requests/branch/create",
            permissions: [Permissions.Pages_Branch_RequestsCreate],
          },
          {
            id: "requests-branch-review",
            title: "بررسی درخواست توسط شعبه",
            path: "/dashboard/requests/branch/review",
            permissions: [Permissions.Pages_Branch_RequestsBranchReview],
          },
          {
            id: "requests-asset-review",
            title: "بررسی و بازنگری اطلاعات ملک توسط شعبه",
            path: "/dashboard/requests/branch/asset-review",
            permissions: [Permissions.Pages_Branch_RequestsAssetReview],
          },
          {
            id: "requests-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/branch/referral",
            permissions: [Permissions.Pages_Branch_RequestsReferral],
          },
          {
            id: "requests-fee-calculation",
            title: "محاسبه کارمزد کارشناس رسمی دادگستری",
            path: "/dashboard/requests/branch/fee-calculation",
            permissions: [Permissions.Pages_Branch_RequestsFeeCalculation],
          },
          {
            id: "requests-referred-to-expert",
            title: "درخواست‌های ارجاعی به کارشناس های رسمی",
            path: "/dashboard/requests/branch/referred-to-expert",
            permissions: [Permissions.Pages_Branch_ReferredToExpert],
          },
        ],
      },
      {
        id: "independent-branch",
        title: "شعبه مستقل",
        icon: "building",
        children: [
          {
            id: "requests-independent-view",
            title: "مشاهده و پیگیری درخواست‌ها",
            path: "/dashboard/requests/independent/view",
            permissions: [
              Permissions.Pages_IndependentBranch_RequestsIndependentView,
            ],
          },
          {
            id: "requests-independent-create",
            title: "ایجاد درخواست جدید",
            path: "/dashboard/requests/independent/create",
            permissions: [
              Permissions.Pages_IndependentBranch_RequestsIndependentCreate,
            ],
          },
          {
            id: "requests-independent-review",
            title: "بررسی درخواست توسط شعبه مستقل",
            path: "/dashboard/requests/independent/review",
            permissions: [
              Permissions.Pages_IndependentBranch_RequestsIndependentReview,
            ],
          },
          {
            id: "requests-independent-asset-review",
            title: "بازنگری اطلاعات ملک توسط شعبه مستقل",
            path: "/dashboard/requests/independent/asset-review",
            permissions: [
              Permissions.Pages_IndependentBranch_RequestsIndependentAssetReview,
            ],
          },
          {
            id: "requests-independent-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/independent/referral",
            permissions: [
              Permissions.Pages_IndependentBranch_RequestsIndependentReferral,
            ],
          },
          {
            id: "requests-independent-fee-calculation",
            title: "محاسبه کارمزد کارشناس رسمی دادگستری",
            path: "/dashboard/requests/independent/fee-calculation",
            permissions: [
              Permissions.Pages_IndependentBranch_RequestsIndependentFeeCalculation,
            ],
          },
          {
            id: "requests-independent-referred-to-expert",
            title: "درخواست‌های ارجاعی به کارشناس های رسمی",
            path: "/dashboard/requests/independent/referred-to-expert",
            permissions: [Permissions.Pages_IndependentBranch_ReferredToExpert],
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
            permissions: [Permissions.Pages_Region_RequestsRegionView],
          },
          {
            id: "requests-region-review",
            title: "کارتابل منطقه",
            path: "/dashboard/requests/region/review",
            permissions: [Permissions.Pages_Region_RequestsRegionReview],
          },
          {
            id: "requests-region-asset-review",
            title: "بررسی و بازنگری اطلاعات ملک توسط منطقه",
            path: "/dashboard/requests/region/asset-review",
            permissions: [Permissions.Pages_Region_RequestsRegionAssetReview],
          },
          {
            id: "requests-region-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/region/referral",
            permissions: [Permissions.Pages_Region_RequestsRegionReferral],
          },
          {
            id: "requests-region-engineering-expert-view",
            title: "کارتابل کارشناس مهندسی",
            path: "/dashboard/requests/region/engineering-expert-view",
            permissions: [
              Permissions.Pages_Region_RequestsRegionEngineeringExpertView,
            ],
          },
          {
            id: "requests-region-engineering-expert-review",
            title: "بررسی و امضا ملک توسط کارشناس مهندسی",
            path: "/dashboard/requests/region/engineering-expert-review",
            permissions: [
              Permissions.Pages_Region_RequestsRegionEngineeringExpertReview,
            ],
          },
          {
            id: "requests-region-engineering-representative-review",
            title: "بررسی توسط نماینده دایره مهندسی",
            path: "/dashboard/requests/region/engineering-representative-review",
            permissions: [
              Permissions.Pages_Region_RequestsRegionEngineeringRepresentativeReview,
            ],
          },
          {
            id: "requests-region-manager-approval",
            title: "بررسی و امضا توسط مدیر منطقه",
            path: "/dashboard/requests/region/manager-approval",
            permissions: [
              Permissions.Pages_Region_RequestsRegionManagerApproval,
            ],
          },
          {
            id: "requests-region-description",
            title: "درج توضیحات و ارجاع به شعبه",
            path: "/dashboard/requests/region/description",
            permissions: [Permissions.Pages_Region_RequestsRegionDescription],
          },
          {
            id: "requests-region-referred-to-expert",
            title: "درخواست‌های ارجاعی به کارشناس های رسمی",
            path: "/dashboard/requests/region/referred-to-expert",
            permissions: [Permissions.Pages_Region_ReferredToExpert],
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
            permissions: [Permissions.Pages_MainOffice_RequestsMainOfficeView],
          },
          {
            id: "requests-main-office-engineering-management-review",
            title: "بررسی و ارجاع توسط مدیریت مهندسی و پشتیبانی",
            path: "/dashboard/requests/main-office/engineering-management-review",
            permissions: [
              Permissions.Pages_MainOffice_RequestsMainOfficeEngineeringManagementReview,
            ],
          },
          {
            id: "requests-main-office-real-estate-department-review",
            title: "بررسی توسط ریاست اداره املاک",
            path: "/dashboard/requests/main-office/real-estate-department-review",
            permissions: [
              Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateDepartmentReview,
            ],
          },
          {
            id: "requests-main-office-real-estate-unit-manager-review",
            title: "بررسی توسط رئیس دایره املاک",
            path: "/dashboard/requests/main-office/real-estate-unit-manager-review",
            permissions: [
              Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateUnitManagerReview,
            ],
          },
          {
            id: "requests-main-office-real-estate-expert-review",
            title: "بررسی توسط کارشناس املاک",
            path: "/dashboard/requests/main-office/real-estate-expert-review",
            permissions: [
              Permissions.Pages_MainOffice_RequestsMainOfficeRealEstateExpertReview,
            ],
          },
          {
            id: "requests-main-office-asset-review",
            title: "بررسی و بازنگری اطلاعات ملک توسط ستاد",
            path: "/dashboard/requests/main-office/asset-review",
            permissions: [
              Permissions.Pages_MainOffice_RequestsMainOfficeAssetReview,
            ],
          },
          {
            id: "requests-main-office-referral",
            title: "نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری",
            path: "/dashboard/requests/main-office/referral",
            permissions: [
              Permissions.Pages_MainOffice_RequestsMainOfficeReferral,
            ],
          },
          {
            id: "requests-main-office-engineering-management-approval",
            title: "بررسی و امضا توسط مدیریت مهندسی و پشتیبانی",
            path: "/dashboard/requests/main-office/engineering-management-approval",
            permissions: [
              Permissions.Pages_MainOffice_RequestsMainOfficeEngineeringManagementApproval,
            ],
          },
          {
            id: "requests-main-office-referred-to-expert",
            title: "درخواست‌های ارجاعی به کارشناس های رسمی",
            path: "/dashboard/requests/main-office/referred-to-expert",
            permissions: [Permissions.Pages_MainOffice_ReferredToExpert],
          },
        ],
      },
    ],
  },
];
