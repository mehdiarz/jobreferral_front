import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllRequestTypes } from "../../../services/RequestTypeCrud/getAll";
import { getAllDepartments } from "../../../services/DepartmentCrud/getAll";
import { getAllPersonalTypes } from "../../../services/PersonalTypeCrud/getAll";
import { getAllCollatralTypes } from "../../../services/CollatralTypeCrud/getAll";
import { getAllDocumentTypes } from "../../../services/DocumentTypeCrud/getAll";
import type { RequestOption } from "./requestShared";

// Reference lists are used by dropdowns; never fall back to the API's default
// page size (usually 10).
const REFERENCE_DATA_LIMIT = 5000;

export const requestReferenceQueryKeys = {
  requestTypes: ["request-types"] as const,
  departments: ["departments"] as const,
  personalTypes: ["personal-types"] as const,
  collateralTypes: ["collateral-types"] as const,
  documentTypes: ["document-types"] as const,
};

function toOptions<T extends { id: number; title?: string | null }>(
  items: T[],
): RequestOption[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title ?? "",
  }));
}

export function useRequestReferenceData(enabled = true) {
  const requestTypesQuery = useQuery({
    queryKey: requestReferenceQueryKeys.requestTypes,
    queryFn: () => getAllRequestTypes({ maxResultCount: REFERENCE_DATA_LIMIT }),
    select: (data) => data.items,
    enabled,
  });
  const departmentsQuery = useQuery({
    queryKey: requestReferenceQueryKeys.departments,
    queryFn: () => getAllDepartments({ maxResultCount: REFERENCE_DATA_LIMIT }),
    select: (data) => data.items,
    enabled,
  });
  const personalTypesQuery = useQuery({
    queryKey: requestReferenceQueryKeys.personalTypes,
    queryFn: () => getAllPersonalTypes({ maxResultCount: REFERENCE_DATA_LIMIT }),
    select: (data) => data.items,
    enabled,
  });
  const collateralTypesQuery = useQuery({
    queryKey: requestReferenceQueryKeys.collateralTypes,
    queryFn: () => getAllCollatralTypes({ maxResultCount: REFERENCE_DATA_LIMIT }),
    select: (data) => data.items,
    enabled,
  });
  const documentTypesQuery = useQuery({
    queryKey: requestReferenceQueryKeys.documentTypes,
    queryFn: () => getAllDocumentTypes({ maxResultCount: REFERENCE_DATA_LIMIT }),
    select: (data) => data.items,
    enabled,
  });

  const requestTypeOptions = useMemo(
    () => toOptions(requestTypesQuery.data ?? []),
    [requestTypesQuery.data],
  );
  const departmentOptions = useMemo(
    () => toOptions(departmentsQuery.data ?? []),
    [departmentsQuery.data],
  );
  const personalTypeOptions = useMemo(
    () => toOptions(personalTypesQuery.data ?? []),
    [personalTypesQuery.data],
  );
  const collateralTypeOptions = useMemo(
    () => toOptions(collateralTypesQuery.data ?? []),
    [collateralTypesQuery.data],
  );
  const documentTypeOptions = useMemo(
    () => toOptions(documentTypesQuery.data ?? []),
    [documentTypesQuery.data],
  );

  return {
    requestTypes: requestTypesQuery.data ?? [],
    departments: departmentsQuery.data ?? [],
    personalTypes: personalTypesQuery.data ?? [],
    collateralTypes: collateralTypesQuery.data ?? [],
    documentTypes: documentTypesQuery.data ?? [],
    requestTypeOptions,
    departmentOptions,
    personalTypeOptions,
    collateralTypeOptions,
    documentTypeOptions,
  };
}
