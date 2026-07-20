
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import FormInput from "../../baseComponents/FormInput";
import CustomButton from "../../baseComponents/CustomButton";
import { authActions } from "../../libs/store/authActions";
import { sendSms } from "../../services/Users/sendSms";
import { verifySmsCode } from "../../services/Users/token";

interface LoginFormData {
  username: string;
  smsCode: string;
}

// Helper function to check if auth bypass is enabled
const isBypassAuthEnabled = (): boolean => {
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH;
  const isEnabled = bypassAuth === 'true' || bypassAuth === true;
  if (import.meta.env.DEV) {
    console.log('[Bypass Auth] VITE_BYPASS_AUTH:', bypassAuth, 'Enabled:', isEnabled);
  }
  return isEnabled;
}

export default function LoginWithSms() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // ارسال SMS
  const sendSmsMutation = useMutation({
    mutationFn: async (username: string) => {
      // Check if bypass auth is enabled - if so, skip API call entirely
      if (isBypassAuthEnabled()) {
        // Return mock success for bypass
        return {
          haveError: false,
          errorMessage: '',
        };
      }
      
      return sendSms(username);
    },
    onSuccess: (data) => {
      if (data.haveError) {
        throw new Error(data?.errorMessage || "ورود ناموفق بود!")
      } else {
        setStep(2)
      }
    },

    onError: (err: any) => {
      throw new err(err?.errorMessage || "ورود ناموفق بود!")
    },
  });

  // تایید SMS و ورود
  const loginMutation = useMutation({
    mutationFn: async ({ username, smsCode }: LoginFormData) => {
      // Check if bypass auth is enabled - if so, skip API call entirely
      if (isBypassAuthEnabled()) {
        // Return mock data for bypass with full admin role to access all routes
        return {
          token: 'bypass-auth-token',
          roles: ['FullAdmin'], // Use FullAdmin role to access all routes
          nationalId: '1234567890',
          fullName: 'Bypass User',
          branchName: 'Bypass Branch',
          success: true,
          haveError: false,
          errorMessage: '',
        };
      }
      
      return verifySmsCode(username, smsCode);
    },
    onSuccess: (data, variables: LoginFormData) => {
      if (data.token) {
        // Set auth state first
        authActions.login(variables.username, data.token, data.roles, data.nationalId, data.fullName, data.branchName);
        
        // Use setTimeout to ensure store is updated before navigation
        // This prevents race conditions where navigation happens before store syncs
        setTimeout(() => {
          router.navigate({ to: "/dashboard" });
        }, 0);
      } else {
        setStep(1);
        throw new Error(data?.errorMessage || "ورود ناموفق بود!")
      }
    },
    onError: (error: any) => {
      setStep(1);
      throw new Error(error.errorMessage || "ورود ناموفق بود!");
    },
  });

  // فرم
  const form = useForm({
    defaultValues: { username: "", smsCode: "" },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-6"
    >
      {step === 1 && (
        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) =>
              !value ? t("form.required") : undefined,
          }}
        >
          {(field) => (
            <>
              <FormInput
                id="username"
                name="username"
                value={field.state.value}
                onChange={field.handleChange}
                label={t("username")}
                disabled={sendSmsMutation.isPending}
                error={field.state.meta.errors[0]}
              />
              <CustomButton
                type="button"
                onClick={() => {
                  if (!field.state.meta.errors.length && field.state.value) {
                    sendSmsMutation.mutate(field.state.value);
                  }
                }}
                isLoading={sendSmsMutation.isPending}
                // disabled={!field.state.value || !!field.state.meta.errors[0]}
                variant="success"
                className="mt-3"
              >
                ارسال کد تایید
              </CustomButton>
            </>
          )}
        </form.Field>
      )}

      {step === 2 && (
        <>
          <form.Field
            name="smsCode"
            validators={{
              onChange: ({ value }) =>
                !value ? t("form.required") : undefined,
            }}
          >
            {(field) => (
              <FormInput
                id="smsCode"
                name="smsCode"
                value={field.state.value}
                onChange={field.handleChange}
                label="کد تایید"
                disabled={loginMutation.isPending}
                error={field.state.meta.errors[0]}
              />
            )}
          </form.Field>
          <CustomButton
            type="submit"
            isLoading={loginMutation.isPending}
            // disabled={!form.state.canSubmit}
            variant="success"
            className="mt-3"
          >
            ورود
          </CustomButton>
        </>
      )}
    </form>
  );
}
