import { apiClient } from "../../libs/api";
import type { DocumentTypeItem, GetAllDocumentTypesParams } from "./types";

type GetAllDocumentTypesApiResponse = {
  result?: {
    items?: DocumentTypeItem[];
    totalCount?: number;
  };
  items?: DocumentTypeItem[];
  totalCount?: number;
};

export async function getAllDocumentTypes(
  params?: GetAllDocumentTypesParams,
): Promise<{
  items: DocumentTypeItem[];
  totalCount: number;
}> {
  const searchParams = new URLSearchParams();

  const title = params?.title?.trim();
  const code = params?.code?.trim();
  const description = params?.description?.trim();
  const sorting = params?.sorting?.trim();

  if (title) {
    searchParams.set("Title", title);
  }

  if (code) {
    searchParams.set("Code", code);
  }

  if (description) {
    searchParams.set("Description", description);
  }

  if (sorting) {
    searchParams.set("Sorting", sorting);
  }

  if (typeof params?.skipCount === "number") {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (typeof params?.maxResultCount === "number") {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const query = searchParams.toString();

  const url = query
    ? `/services/app/DocumentTypeCrud/GetAll?${query}`
    : "/services/app/DocumentTypeCrud/GetAll";

  const res = await apiClient.request<GetAllDocumentTypesApiResponse>(url, {
    method: "GET",
  });

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
