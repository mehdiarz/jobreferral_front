import { apiClient } from "../../libs/api";

export interface RegionOutputDto {
  id: number;
  code: string | null;
  title: string | null;
  description: string | null;
  creationTime?: string;
  lastModificationTime?: string | null;
  isDeleted?: boolean;
}

export interface GetRegionByCodeResponse {
  result: RegionOutputDto;
  success: boolean;
  error?: { message?: string; details?: string };
}

/**
 * Get region by RegionCode
 * GET /api/services/app/RegionCrud/GetByCode?RegionCode={regionCode}
 */
export async function getRegionByCode(
  regionCode: string,
): Promise<RegionOutputDto> {
  const searchParams = new URLSearchParams({ RegionCode: regionCode.trim() });

  const res = await apiClient.request<GetRegionByCodeResponse>(
    `/services/app/RegionCrud/GetByCode?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  return res?.result ?? (res as unknown as RegionOutputDto);
}
