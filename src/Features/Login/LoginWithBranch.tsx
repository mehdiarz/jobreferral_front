import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import FormInput from "../../baseComponents/FormInput";
import CustomButton from "../../baseComponents/CustomButton";
import { authActions } from "../../libs/store/authActions";
import { authenticate } from "../../services/Users/authenticate";
import { getPermissionsForRoleIds } from "../../services/Permissions/getPermissionsForRoleIds";

interface LoginFormData {
  username: string;
  password: string;
}

// Helper function to check if auth bypass is enabled
const isBypassAuthEnabled = (): boolean => {
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH;
  const isEnabled = bypassAuth === "true" || bypassAuth === true;
  if (import.meta.env.DEV) {
    console.log(
      "[Bypass Auth] VITE_BYPASS_AUTH:",
      bypassAuth,
      "Enabled:",
      isEnabled,
    );
  }
  return isEnabled;
};

export default function LoginWithBranch() {
  const { t } = useTranslation();
  const router = useRouter();

  // ✅ mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: LoginFormData) => {
      // Check if bypass auth is enabled - if so, skip API call entirely
      if (isBypassAuthEnabled()) {
        // Return mock data for bypass with full admin role to access all routes
        return {
          token: "bypass-auth-token",
          roles: ["ADMIN"],
          roleIds: [1],
          nationalId: "1234567890",
          fullName: "Bypass User",
          branchName: "Bypass Branch",
        };
      }

      return authenticate(username, password, true);
    },
    onSuccess: async (data, variables) => {
      console.log("🚀 onSuccess called, data:", data);

      if (data?.token) {
        console.log("🔑 Token received, logging in...");

        authActions.login(
          variables.username,
          data.token,
          data.roles,
          data.nationalId,
          data.fullName,
          data.branchName,
        );

        console.log("👤 Auth login done. roleIds:", data.roleIds);
        console.log("📋 roles:", data.roles);

        if (data.roleIds?.length > 0) {
          console.log("🔄 Fetching permissions for roleIds:", data.roleIds);
          try {
            const permissions = await getPermissionsForRoleIds(data.roleIds);
            console.log("✅ Permissions received:", permissions);
            authActions.setPermissions(permissions);
          } catch (err) {
            console.error("❌ Permission fetch failed:", err);
          }
        } else {
          console.warn("⚠️ No roleIds to fetch permissions for!");
        }

        console.log("🧭 Navigating to dashboard...");
        setTimeout(() => {
          router.navigate({ to: "/dashboard" });
        }, 0);
      } else {
        throw new Error("ورود ناموفق بود!");
      }
    },
    onError: () => {
      // Error message is shown via loginMutation.error?.message (from authenticate() throw)
    },
  });

  // ✅ فرم
  const form = useForm({
    defaultValues: { username: "", password: "" },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value);
    },
  });

  return (
    <>
      {loginMutation.isError && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">
            {loginMutation.error?.message || t("login.error")}
          </div>
        </div>
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        {/* Username */}
        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) => (!value ? t("form.required") : undefined),
          }}
        >
          {(field) => (
            <FormInput
              id="username"
              name="username"
              value={field.state.value}
              onChange={field.handleChange}
              label={t("username")}
              disabled={loginMutation.isPending}
              dir="ltr"
              required
              error={field.state.meta.errors[0]}
            />
          )}
        </form.Field>

        {/* Password */}
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => (!value ? t("form.required") : undefined),
          }}
        >
          {(field) => (
            <FormInput
              id="password"
              name="password"
              type="password"
              value={field.state.value}
              onChange={field.handleChange}
              label={t("password")}
              disabled={loginMutation.isPending}
              dir="ltr"
              required
              error={field.state.meta.errors[0]}
            />
          )}
        </form.Field>

        {/* دکمه ورود */}
        <CustomButton
          type="submit"
          isLoading={loginMutation.isPending}
          // disabled={!form.state.canSubmit || loginMutation.isPending}
          variant="success"
          size="md"
          className="mt-3"
        >
          {t("login.submit", "ورود")}
        </CustomButton>
      </form>
    </>
  );
}
