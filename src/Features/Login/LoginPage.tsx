import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Key } from "lucide-react";
import LoginWithBranch from "./LoginWithBranch";
import { authenticateWithToken } from "../../services/Users/authenticate";
import { authActions } from "../../libs/store/authActions";
import { getPermissionsForRoleIds } from "../../services/Permissions/getPermissionsForRoleIds";

function getPAndTokFromUrl(): { p: string; tok: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const p = params.get("p");
  const tok = params.get("tok");
  if (p && tok) return { p, tok };
  return null;
}

export default function LoginForm() {
  const router = useRouter();
  const [tokenParams] = useState<{ p: string; tok: string } | null>(() =>
    getPAndTokFromUrl(),
  );

  const tokenLoginMutation = useMutation({
    mutationFn: ({ p, tok }: { p: string; tok: string }) =>
      authenticateWithToken(p, tok),
    onSuccess: async (data) => {
      if (data?.token) {
        authActions.login(
          "token-user",
          data.token,
          data.roles,
          data.nationalId,
          data.fullName,
          data.branchName,
        );
        const permissions =
          data.roleIds?.length > 0
            ? await getPermissionsForRoleIds(data.roleIds)
            : [];
        authActions.setPermissions(permissions);
        const url = new URL(window.location.href);
        url.searchParams.delete("p");
        url.searchParams.delete("tok");
        window.history.replaceState({}, "", url.pathname + url.search);
        router.navigate({ to: "/dashboard" });
      }
    },
  });

  useEffect(() => {
    if (tokenParams) {
      tokenLoginMutation.mutate(tokenParams);
    }
  }, [tokenParams]);

  // Token-based login
  if (tokenParams) {
    return (
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl
        border border-gray-200/60 dark:border-gray-700/60"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
            ورود به سامانه
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            سامانه ارجاع کار به کارشناس دادگستری
          </p>
        </div>

        {/* Loading state */}
        {tokenLoginMutation.isPending && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              در حال ورود به سامانه...
            </span>
          </div>
        )}

        {/* Error state */}
        {tokenLoginMutation.isError && (
          <>
            <div
              className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200
              dark:border-red-800 p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50
                  flex items-center justify-center flex-shrink-0"
                >
                  <Key className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                    خطا در ورود
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                    {tokenLoginMutation.error?.message ||
                      "ورود با لینک ناموفق بود."}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    می‌توانید با نام کاربری و رمز عبور وارد شوید.
                  </p>
                </div>
              </div>
            </div>
            <LoginWithBranch />
          </>
        )}
      </div>
    );
  }

  // Normal login form
  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl
      border border-gray-200/60 dark:border-gray-700/60"
    >
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
          ورود به سامانه
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          سامانه ارجاع کار به کارشناس دادگستری
        </p>
      </div>

      {/* Login Form */}
      <LoginWithBranch />

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-[10px] text-center text-gray-400 dark:text-gray-500">
          با ورود به سامانه، قوانین و مقررات را می‌پذیرید
        </p>
      </div>
    </div>
  );
}
