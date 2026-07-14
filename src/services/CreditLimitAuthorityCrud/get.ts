import { apiClient } from "../../libs/api";
import type { CreditLimitAuthorityItem } from "./types";

export async function getCreditLimitAuthority(id: number): Promise<CreditLimitAuthorityItem> {
    return apiClient.request<CreditLimitAuthorityItem>(
        `/services/app/CreditLimitAuthorityCrud/Get?Id=${id}`,
        { method: "GET" }
    );
}