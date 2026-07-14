import { apiClient } from "../../libs/api";
import type { CreateCreditLimitAuthorityBody, CreditLimitAuthorityItem } from "./types";

export async function createCreditLimitAuthority(
    body: CreateCreditLimitAuthorityBody
): Promise<CreditLimitAuthorityItem> {
    return apiClient.request<CreditLimitAuthorityItem>(
        "/services/app/CreditLimitAuthorityCrud/Create",
        {
            method: "POST",
            body: JSON.stringify({ id: 0, ...body }),
        }
    );
}