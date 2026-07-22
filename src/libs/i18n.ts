import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translation resources
const resources = {
  fa: {
    translation: {
      // Authentication
      login: "ورود",
      logout: "خروج",
      username: "نام کاربری",
      password: "رمز عبور",
      promisorId: "رمز عبور",
      "login.title": "ورود به سیستم",
      "login.submit": "ورود",
      "login.loading": "در حال ورود...",
      "login.error": "خطا در ورود",
      "login.invalid": "نام کاربری یا رمز عبور اشتباه است",

      // Navigation
      dashboard: "داشبورد",
      forms: "فرم‌ها",
      reports: "گزارشات",
      settings: "تنظیمات",
      "forms.personal": "فرم اطلاعات شخصی",
      "forms.company": "فرم اطلاعات شرکت",

      // Common
      loading: "در حال بارگذاری...",
      error: "خطا",
      success: "موفقیت‌آمیز",
      submit: "ارسال",
      cancel: "لغو",
      save: "ذخیره",
      delete: "حذف",
      edit: "ویرایش",
      view: "مشاهده",
      search: "جستجو",
      filter: "فیلتر",
      reset: "بازنشانی",
      close: "بستن",
      confirm: "تایید",
      "no-data": "داده‌ای یافت نشد",

      // Forms
      "form.required": "این فیلد الزامی است",
      "form.invalid-email": "آدرس ایمیل معتبر نیست",
      "form.invalid-phone": "شماره تلفن معتبر نیست",
      "form.file-too-large": "حجم فایل بیش از حد مجاز است",
      "form.invalid-file-type": "نوع فایل مجاز نیست",
      "form.upload-file": "انتخاب فایل",
      "form.drag-drop": "فایل را اینجا بکشید یا کلیک کنید",
      "form.submitting": "در حال ارسال...",
      "form.submitted": "فرم با موفقیت ارسال شد",
      "form.error": "خطا در ارسال فرم",

      // Personal Form
      "personal.title": "اطلاعات شخصی",
      "personal.firstName": "نام",
      "personal.lastName": "نام خانوادگی",
      "personal.nationalId": "کد ملی",
      "personal.email": "آدرس ایمیل",
      "personal.phone": "شماره تلفن",
      "personal.address": "آدرس",
      "personal.birthDate": "تاریخ تولد",
      "personal.document": "مدرک هویت",

      // Company Form
      "company.title": "اطلاعات شرکت",
      "company.name": "نام شرکت",
      "company.registrationNumber": "شماره ثبت",
      "company.nationalId": "شناسه ملی",
      "company.email": "ایمیل شرکت",
      "company.phone": "تلفن شرکت",
      "company.address": "آدرس شرکت",
      "company.establishmentDate": "تاریخ تاسیس",
      "company.license": "جواز کسب",

      // Reports
      "reports.title": "گزارشات",
      "reports.id": "شناسه",
      "reports.title-col": "عنوان",
      "reports.category": "دسته‌بندی",
      "reports.date": "تاریخ",
      "reports.status": "وضعیت",
      "reports.amount": "مبلغ",
      "reports.actions": "عملیات",
      "reports.search-placeholder": "جستجوی گزارشات...",
      "reports.filter-category": "فیلتر بر اساس دسته‌بندی",
      "reports.no-reports": "گزارشی یافت نشد",

      // Status values
      "status.completed": "تکمیل شده",
      "status.pending": "در انتظار تایید",
      "status.in-review": "در حال بررسی",
      "status.rejected": "رد شده",

      // Categories
      "category.sales": "فروش",
      "category.financial": "مالی",
      "category.hr": "منابع انسانی",
      "category.project": "پروژه",
      "category.marketing": "بازاریابی",

      // Dashboard
      "dashboard.welcome": "خوش آمدید",
      "dashboard.overview": "نمای کلی",
      "dashboard.recent-activity": "فعالیت‌های اخیر",

      // Error messages
      "error.network": "خطا در اتصال به سرور",
      "error.server": "خطای سرور",
      "error.unauthorized": "دسترسی غیرمجاز",
      "error.forbidden": "عدم دسترسی",
      "error.not-found": "یافت نشد",
      "error.validation": "خطا در اعتبارسنجی",

      //Promisor
      "Promisor.accountNumber": "شماره حساب متعهد",
      "Promisor.mobile": "تلفن همراه",
      "Promisor.accountPaymentSupport": "شماره حساب تسهیلات متعهد",
      "Promisor.username1": "کاربر تایید کننده اول",
      "Promisor.mobile1": "شماره همراه تایید کننده اول",
      "Promisor.fullname1": "نام کامل تایید کننده اول",
      "Promisor.username2": "کاربر تایید کننده دوم",
      "Promisor.mobile2": "شماره همراه تایید کننده دوم",
      "Promisor.fullname2": "نام کامل تایید کننده دوم",
      "Promisor.branchWageAccountNumber": "شماره حساب کارمزد شعبه",
      "Promisor.branchInterfaceAccountNumber": "شماره حساب واسط شعبه",
      "Promisor.description": "توضیحات",
      "Promisor.isOrganization": "حقوقی می باشد",
      "Promisor.enactmentNumber": "شماره مصوبه",
      "Promisor.enactmentDate": "تاریخ مصوبه",
      "Promisor.contractNumber": "شماره قرارداد",
      "Promisor.contractStartDate": "تاریخ شروع قرارداد",
      "Promisor.contractEndDate": " تاریخ پایان قرارداد",
      "Promisor.dueDate": "روز سررسید",
      "Promisor.minMonthEffectiveDate": "شروع بازه ثبت تعهد",
      "Promisor.maxMonthEffectiveDate": "اتمام بازه ثبت تعهد",
      "Promisor.maxAmountPerYear": "سقف سالیانه (مبلغ مصوبه)",
      "Promisor.maxAmountPerMonth": "سقف ماهیانه",
      "Promisor.transferAmount": "سقف مبلغ انتقال",
      "Promisor.transferPercent": "سقف درصد انتقال",
      "Promisor.tanzilAmount": "سقف مبلغ تسهیلات",
      "Promisor.tanzilPercent": "سقف درصد تسهیلات",
      "Promisor.wagePercentOnConfirm": "درصد کارمزد هنگام تایید شعبه",

      //CreateEnactment
      "Enactment.enactmentNumber": "شماره مصوبه",
      "Enactment.enactmentDate": "تاریخ مصوبه",
      "Enactment.contractNumber": "شماره قرارداد",
      "Enactment.contractStartDate": "تاریخ شروع قرارداد",
      "Enactment.contractEndDate": "تاریخ پایین قرارداد",
      "Enactment.dueDate": "روز سررسید",
      "Enactment.minMonthEffectiveDate": "شروع بازه ثبت تعهد",
      "Enactment.maxMonthEffectiveDate": "اتمام بازه ثبت تعهد",
      "Enactment.maxAmountYear": "سقف سالیانه (مبلغ مصوبه)",
      "Enactment.maxAmountMonth": "سقف ماهیانه",
      "Enactment.transferAmount": "سقف مبلغ انتقال",
      "Enactment.transferPercent": "سقف درصد انتقال",
      "Enactment.tanzilAmount": "سقف مبلغ تسهیلات",
      "Enactment.tanzilPercent": "سقف درصد تسهیلات",
      "Enactment.wagePercentOnConfirm": "درصد کارمزد هنگام تایید شعبه",

      //CreateCustomer
      "customer.accountNumber": "شماره حساب",
      "customer.mobile": "تلفن همراه",
      "customer.combo": "کمبو",

      //ModalPreview
      ModalPreview: "نمایش جزئیات",

      //factor
      "factor.Customer": "انتخاب مشتری",
      "factor.documentDate": "تاریخ فاکتور",
      "factor.factorNumber": "شماره فاکتور",
      "factor.documentNumber": "َشماره قرارداد",
      "factor.contractFiles": "تصویر فاکتور",

      //factorForm
      "Createfactor.FactorBuyerFreeList": "انتخاب فاکتور",
      "Createfactor.dueDate": "تاریخ سررسید دستور پرداخت",
      "Createfactor.amountPaymentOrder": "مبلغ دستور پرداخت",
      "Createfactor.GroupOneList": "گروه اول",
      "Createfactor.GroupTwoList": "گروه دوم",

      "Pages.Collatrals": "وثیقه‌ها",
      "Pages.CollatralTypes": "انواع وثیقه",
      "Pages.Customers": "مشتریان",
      "Pages.CreditLimitAuthorites": "حدود اختیارات",
      "Pages.DepartmentGrades": "رتبه‌های دپارتمان",
      "Pages.Departments": "دپارتمان‌ها",
      "Pages.DocumentTypes": "انواع مدارک",
      "Pages.Documents": "مدارک",
      "Pages.ExpertiseZones": "حدود صلاحیت کارشناس",
      "Pages.JudicialExperts": "کارشناسان دادگستری",
      "Pages.PersonalTypes": "انواع شخص",
      "Pages.Regions": "مناطق استانی",
      "Pages.RequestStatuses": "وضعیت درخواست‌ها",
      "Pages.RequestTypes": "انواع درخواست",
      "Pages.Requests": "درخواست‌ها",
      "Pages.Roles": "نقش‌ها",
      "Pages.Tenants": "مستاجرها",
      "Pages.Users": "کاربران",
      "Pages.Users.Activation": "فعال‌سازی کاربران",
      "Pages.BaseInfo": "اطلاعات پایه",
    },
  },
  en: {
    translation: {
      // Authentication
      login: "Login",
      logout: "Logout",
      username: "Username",
      password: "Password",
      promisorId: "promisorId",
      "login.title": "Login to System",
      "login.submit": "Login",
      "login.loading": "Logging in...",
      "login.error": "Login Error",
      "login.invalid": "Invalid username or password",

      // Navigation
      dashboard: "Dashboard",
      forms: "Forms",
      reports: "Reports",
      settings: "Settings",
      "forms.personal": "Personal Information Form",
      "forms.company": "Company Information Form",

      // Common
      loading: "Loading...",
      error: "Error",
      success: "Success",
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      search: "Search",
      filter: "Filter",
      reset: "Reset",
      close: "Close",
      confirm: "Confirm",
      "no-data": "No data found",

      // Forms
      "form.required": "This field is required",
      "form.invalid-email": "Invalid email address",
      "form.invalid-phone": "Invalid phone number",
      "form.file-too-large": "File size is too large",
      "form.invalid-file-type": "Invalid file type",
      "form.upload-file": "Choose File",
      "form.drag-drop": "Drag file here or click to select",
      "form.submitting": "Submitting...",
      "form.submitted": "Form submitted successfully",
      "form.error": "Error submitting form",

      // Personal Form
      "personal.title": "Personal Information",
      "personal.firstName": "First Name",
      "personal.lastName": "Last Name",
      "personal.nationalId": "National ID",
      "personal.email": "Email Address",
      "personal.phone": "Phone Number",
      "personal.address": "Address",
      "personal.birthDate": "Birth Date",
      "personal.document": "Identity Document",

      // Company Form
      "company.title": "Company Information",
      "company.name": "Company Name",
      "company.registrationNumber": "Registration Number",
      "company.nationalId": "National ID",
      "company.email": "Company Email",
      "company.phone": "Company Phone",
      "company.address": "Company Address",
      "company.establishmentDate": "Establishment Date",
      "company.license": "Business License",

      // Reports
      "reports.title": "Reports",
      "reports.id": "ID",
      "reports.title-col": "Title",
      "reports.category": "Category",
      "reports.date": "Date",
      "reports.status": "Status",
      "reports.amount": "Amount",
      "reports.actions": "Actions",
      "reports.search-placeholder": "Search reports...",
      "reports.filter-category": "Filter by category",
      "reports.no-reports": "No reports found",

      // Status values
      "status.completed": "Completed",
      "status.pending": "Pending Approval",
      "status.in-review": "In Review",
      "status.rejected": "Rejected",

      // Categories
      "category.sales": "Sales",
      "category.financial": "Financial",
      "category.hr": "Human Resources",
      "category.project": "Project",
      "category.marketing": "Marketing",

      // Dashboard
      "dashboard.welcome": "Welcome",
      "dashboard.overview": "Overview",
      "dashboard.recent-activity": "Recent Activity",

      // Error messages
      "error.network": "Network connection error",
      "error.server": "Server error",
      "error.unauthorized": "Unauthorized access",
      "error.forbidden": "Access forbidden",
      "error.not-found": "Not found",
      "error.validation": "Validation error",

      //Promisor
      "Promisor.AccountNumber": "AccountNumber",
      "Promisor.Mobile": "MobileNumber",
      "Promisor.accountPaymentSupport": "AccountPaymentSupport",
      "Promisor.username1": "UserNameOne",
      "Promisor.mobile1": "MobileOne",
      "Promisor.fullname1": "FullNameOne",
      "Promisor.username2": "UserNameTwo",
      "Promisor.mobile2": "MobileTwo",
      "Promisor.fullname2": "FullNameTwo",
      "Promisor.branchWageAccountNumber": "branchWageAccountNumber",
      "Promisor.branchInterfaceAccountNumber": "branchWageAccountNumber",
      "Promisor.description": "description",
      "Promisor.isOrganization": "isOrganization",
      "Promisor.enactmentNumber": "enactmentNumber",
      "Promisor.enactmentDate": "enactmentDate",
      "Promisor.contractNumber": "contractNumber",
      "Promisor.contractStartDate": "contractStartDate",
      "Promisor.contractEndDate": "contractEndDate",
      "Promisor.dueDate": "dueDate",
      "Promisor.minMonthEffectiveDate": "minMonthEffectiveDate",
      "Promisor.maxMonthEffectiveDate": "maxMonthEffectiveDate",
      "Promisor.maxAmountPerYear": "maxAmountPerYear",
      "Promisor.maxAmountPerMonth": "maxAmountPerMonth",
      "Promisor.transferAmount": "transferAmount",
      "Promisor.transferPercent": "transferPercent",
      "Promisor.tanzilAmount": "tanzilAmount",
      "Promisor.tanzilPercent": "tanzilPercent",
      "Promisor.wagePercentOnConfirm": "wagePercentOnConfirm",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fa",
    lng: "fa", // Default to Farsi
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
