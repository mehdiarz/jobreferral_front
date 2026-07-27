import { MainLayout } from "../../baseComponents/MainLayout";
import { FluidGrid } from "../../baseComponents/FluidGrid";
import { FluidCol } from "../../baseComponents/FluidCol";
import FormInput from "../../baseComponents/FormInput";
import PageTitle from "../../baseComponents/PageTitle";
import { useAuthStore } from "../../libs/store";
import { isoToPersian } from "../../utils/persianToISO";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  console.log("👤 Profile user:", user);

  // اطلاعات از userObject توی token
  const firstName = user?.name || user?.fullName?.split(" ")[0] || "-";
  const lastName = user?.surname || user?.fullName?.split(" ")[1] || "-";
  const status = user?.isActive ? "فعال" : "غیرفعال";
  const creationTime = user?.creationTime
    ? isoToPersian(user.creationTime)
    : "-";
  const personnelCode = user?.sid || "-";
  const branch = user?.bid || user?.branchName || "-";
  const position = user?.pid || user?.username || "-";

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="پروفایل کاربری" />

      <div className="rounded-lg bg-white p-6 shadow-sm max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {firstName} {lastName}
            </h3>
            <p className="text-sm text-gray-500">{position}</p>
          </div>
          <span
            className={`mr-auto px-3 py-1 rounded-full text-xs font-medium ${
              status === "فعال"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status}
          </span>
        </div>

        <FluidGrid className="gap-4">
          <FluidCol colSpan="col-span-12 md:col-span-6">
            <FormInput
              id="firstName"
              name="firstName"
              label="نام"
              value={firstName}
              dir="rtl"
              disabled
              onChange={() => {}}
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12 md:col-span-6">
            <FormInput
              id="lastName"
              name="lastName"
              label="نام خانوادگی"
              value={lastName}
              dir="rtl"
              disabled
              onChange={() => {}}
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12 md:col-span-6">
            <FormInput
              id="personnelCode"
              name="personnelCode"
              label="کد پرسنلی"
              value={personnelCode}
              dir="ltr"
              disabled
              onChange={() => {}}
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12 md:col-span-6">
            <FormInput
              id="branch"
              name="branch"
              label="شعبه"
              value={branch}
              dir="ltr"
              disabled
              onChange={() => {}}
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12 md:col-span-6">
            <FormInput
              id="position"
              name="position"
              label="سمت"
              value={position}
              dir="ltr"
              disabled
              onChange={() => {}}
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12 md:col-span-6">
            <FormInput
              id="status"
              name="status"
              label="وضعیت"
              value={status}
              dir="rtl"
              disabled
              onChange={() => {}}
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12">
            <FormInput
              id="creationTime"
              name="creationTime"
              label="تاریخ عضویت"
              value={creationTime}
              dir="ltr"
              disabled
              onChange={() => {}}
            />
          </FluidCol>
        </FluidGrid>
      </div>
    </MainLayout.Main>
  );
}
