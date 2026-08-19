export const REQUEST_DEPARTMENT_TYPES = {
  branch: {
    id: 1,
    name: "شعبه",
    pageTitle: "مشاهده و پیگیری درخواست‌های شعبه",
  },
  independentBranch: {
    id: 2,
    name: "شعبه مستقل",
    pageTitle: "مشاهده و پیگیری درخواست‌های شعبه مستقل",
  },
  region: {
    id: 3,
    name: "منطقه",
    pageTitle: "مشاهده و پیگیری درخواست‌های منطقه",
  },
  mainOffice: {
    id: 4,
    name: "ستاد",
    pageTitle: "مشاهده و پیگیری درخواست‌های ستاد",
  },
} as const;

export type RequestDepartmentTypeConfig =
  (typeof REQUEST_DEPARTMENT_TYPES)[keyof typeof REQUEST_DEPARTMENT_TYPES];
