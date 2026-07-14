import { apiClient } from "../../libs/api";
import type { EditCreditLimitAuthorityBody, CreditLimitAuthorityItem } from "./types";

export async function editCreditLimitAuthority(
    body: EditCreditLimitAuthorityBody
): Promise<CreditLimitAuthorityItem> {
    return apiClient.request<CreditLimitAuthorityItem>(
        "/services/app/CreditLimitAuthorityCrud/Edit",
        {
            method: "POST",
            body: JSON.stringify(body),
        }
    );
}