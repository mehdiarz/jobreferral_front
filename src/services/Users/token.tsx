import { apiClient } from "../../libs/api";

// 📌 تأیید کد SMS
export const verifySmsCode = async (username: string, smsReceived: string) => {
    return apiClient.request<{
        success: boolean;
        token?: string;
        message?: string;
        roles: string[];
        nationalId: string;
        haveError: boolean;
        errorMessage: string;
        fullName: string;
        branchName: string;
    }>
        ('/User/token', {
            method: 'POST',
            body: JSON.stringify({
                username,
                smsReceived,
                checkSms: true,
            }),
        });
}