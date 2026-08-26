import { apiClient } from "../../libs/api";

export interface UserActionBody {
  accepted?: boolean | null;
  requestId: number;
}

export interface UserActionResult {
  previousStateCode: number;
  previousStateTitle?: string | null;
  nextStateCode: number;
  nextStateTitle?: string | null;
  nextDepartmentId: number;
  message?: string | null;
}

interface UserActionApiResponse {
  result?: UserActionResult | null;
  success?: boolean;
  error?: unknown;
}

/**
 * متن مناسب برای نمایش پس از انجام عملیات درخواست.
 * در صورت ارسال message از بک‌اند، همان پیام در اولویت است.
 */
export function getUserActionSuccessMessage(
  action: UserActionResult | null | undefined,
  fallback = "عملیات با موفقیت انجام شد",
): string {
  const backendMessage = action?.message?.trim();

  if (backendMessage) {
    return backendMessage;
  }

  const previousStateTitle = action?.previousStateTitle?.trim();
  const nextStateTitle = action?.nextStateTitle?.trim();

  if (previousStateTitle && nextStateTitle) {
    return `درخواست با موفقیت از وضعیت «${previousStateTitle}» به وضعیت «${nextStateTitle}» منتقل شد.`;
  }

  if (nextStateTitle) {
    return `درخواست با موفقیت به وضعیت «${nextStateTitle}» منتقل شد. لطفاً برای پیگیری، به کارتابل مربوط به وضعیت جدید مراجعه کنید.`;
  }

  return fallback;
}

export async function userAction(
  body: UserActionBody,
): Promise<UserActionResult | null> {
  const response = await apiClient.request<UserActionApiResponse>(
    "/services/app/RequestCrud/UserAction",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return response?.result ?? null;
}
