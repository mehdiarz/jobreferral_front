import { apiClient } from "../../libs/api";

// 📌 ارسال SMS
export const sendSms = async (username: string) => {
  return apiClient.request<{
    success: boolean;
    message?: string;
    haveError?: boolean;
    errorMessage?: string

  }>("/User/sendSms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  }
  );
};