import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
        // Remove p and tok from URL and redirect
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

  // p and tok in URL: show loading or error, no form
  if (tokenParams) {
    return (
      <div className="bg-white rounded-xl p-4">
        <h2 className="text-sm font-semibold text-blue-900 mb-6">
          ورود به سامانه ارجاع کار به کارشناس دادگستری
        </h2>
        {tokenLoginMutation.isPending && (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>در حال ورود...</span>
          </div>
        )}
        {tokenLoginMutation.isError && (
          <>
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">
                {tokenLoginMutation.error?.message ||
                  "ورود با لینک ناموفق بود."}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                می‌توانید با نام کاربری و رمز عبور وارد شوید.
              </p>
            </div>
            <LoginWithBranch />
          </>
        )}
      </div>
    );
  }

  // Normal login form
  return (
    <div className="bg-white rounded-xl p-4">
      <h2 className="text-sm font-semibold text-blue-900 mb-6">
        ورود به سامانه ارجاع کار به کارشناس دادگستری
      </h2>
      <LoginWithBranch />
    </div>
  );
}
