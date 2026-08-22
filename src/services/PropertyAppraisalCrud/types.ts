// ─── Lookup Types ────────────────────────────────────────────────
export interface LookupValueDto {
  code: string;
  title: string;
}

export interface PropertyAppraisalLookupsDto {
  buildingCertificates?: LookupValueDto[] | null;
  constructionQualities?: LookupValueDto[] | null;
  definitiveOwnershipDocumentTypes?: LookupValueDto[] | null;
  disasterVulnerabilities?: LookupValueDto[] | null;
  evaluationTopics?: LookupValueDto[] | null;
  inheritanceStatuses?: LookupValueDto[] | null;
  leaseTypes?: LookupValueDto[] | null;
  propertyOccupiers?: LookupValueDto[] | null;
  structureTypes?: LookupValueDto[] | null;
  typeOfEndowmentProperties?: LookupValueDto[] | null;
  typeOfWorkCompletions?: LookupValueDto[] | null;
  urbanLocationGrades?: LookupValueDto[] | null;
  valuationPriceBasises?: LookupValueDto[] | null;
}

// ─── Input DTO (Create/Edit) ─────────────────────────────────────
export interface PropertyAppraisalInputDto {
  id?: number;
  // مشخصات ملک و متقاضی
  applicantName?: string | null;
  loanType?: string | null;
  loanAmount?: number;
  ownerName?: string | null;
  ownerAddress?: string | null;
  propertyOccupierCode?: string | null;
  propertyOccupierDescription?: string | null;
  propertyNumber?: string | null;
  seperatedFrom?: string | null;
  separationPiece?: string | null;
  registrationNumber?: string | null;
  page?: string | null;
  officeNumber?: string | null;
  part?: string | null;
  city?: string | null;
  hasDefinitiveOwnershipDocument?: boolean;
  definitiveOwnershipDocumentTypeCode?: string | null;
  pageCount?: number;
  dong?: number;
  postalCode?: string | null;
  municipalArea?: string | null;
  ownerPhone?: string | null;
  titleDeedNumber?: string | null;
  propertyType?: string | null;
  useAccordingToTheCompletionOfTheWork?: string | null;
  typeOfWorkCompletionCode?: string | null;
  typeOfUseOfTheProperty?: string | null;
  hasMatchingTheAreaWithTheDocument?: boolean;
  explanationInCaseOfDisagreement?: string | null;
  typeOfEndowmentPropertyCode?: string | null;
  typeOfEndowmentPropertyIfOther?: string | null;
  evaluationTopicCode?: string | null;

  // جدول ارزیابی
  landArea?: number;
  landUnitPrice?: number;
  landTotalPrice?: number;
  landShareArea?: number;
  landShareUnitPrice?: number;
  landShareTotalPrice?: number;
  basementArea?: number;
  basementUnitPrice?: number;
  basementTotalPrice?: number;
  groundFloorArea?: number;
  groundFloorUnitPrice?: number;
  groundFloorTotalPrice?: number;
  mezzanineArea?: number;
  mezzanineUnitPrice?: number;
  mezzanineTotalPrice?: number;
  floor1Area?: number;
  floor1UnitPrice?: number;
  floor1TotalPrice?: number;
  floor2Area?: number;
  floor2UnitPrice?: number;
  floor2TotalPrice?: number;
  floor3Area?: number;
  floor3UnitPrice?: number;
  floor3TotalPrice?: number;
  floor4Area?: number;
  floor4UnitPrice?: number;
  floor4TotalPrice?: number;
  floor5Area?: number;
  floor5UnitPrice?: number;
  floor5TotalPrice?: number;
  otherFloorsArea?: number;
  otherFloorsUnitPrice?: number;
  otherFloorsTotalPrice?: number;
  landscapingArea?: number;
  landscapingUnitPrice?: number;
  landscapingTotalPrice?: number;
  facilitiesArea?: number;
  facilitiesUnitPrice?: number;
  facilitiesTotalPrice?: number;
  totalArea?: number;
  totalUnitPrice?: number;
  totalPrice?: number;
  goodwillAdjustment?: number;
  finalPrice?: number;
  finalPriceInWords?: string | null;

  // توضیحات تکمیلی ملک
  totalFloors?: number;
  usageBreakdown?: string | null;
  structureTypeCode?: string | null;
  structureTypeOther?: string | null;
  facadeType?: string | null;
  buildingAgeCalculation?: string | null;
  heatingSystem?: string | null;
  coolingSystem?: string | null;

  // انشعابات و مجوزها
  hasWater?: boolean;
  hasElectricity?: boolean;
  electricityDetails?: string | null;
  hasGas?: boolean;
  hasTelephone?: boolean;
  hasMunicipalCorrection?: boolean;
  certificateDetails?: string | null;
  otherDetails?: string | null;

  // وضعیت مالکیت و کیفیت ساختمان
  isOwnerAlive?: boolean;
  inheritanceStatusCode?: string | null;
  urbanLocationGradeCode?: string | null;
  disasterVulnerabilityCode?: string | null;
  constructionQualityCode?: string | null;

  // امکانات و مشاعات
  hasParking?: boolean;
  hasSharedParking?: boolean;
  parkingCount?: number;
  hasStorage?: boolean;
  storageCount?: number;
  storageArea?: number;
  hasElevator?: boolean;
  elevatorCount?: number;
  otherPrivileges?: string | null;

  // اسناد و تعهدات
  hasCertificate?: boolean;
  certificateTypeCode?: string | null;
  certificateNumber?: string | null;
  certificateDate?: string | null;
  isMortgagedOrSeized?: boolean;
  mortgageBeneficiary?: string | null;

  // منافع و اجاره
  hasTransferredBenefits?: boolean;
  benefitsTransferDescription?: string | null;
  isOccupiedByTenant?: boolean;
  rentalAdvancePayment?: number;
  monthlyRent?: number;
  leaseTypeCode?: string | null;
  leaseTrackingCode?: string | null;
  leaseNumber?: string | null;
  leaseDate?: string | null;

  // مغازه و وضعیت فروش
  hasShop?: boolean;
  shopCount?: number;
  shopOccupier?: string | null;
  shopBusinessType?: string | null;
  isReadilyMarketable?: boolean;
  marketabilityNotes?: string[] | null;
  valuationPriceBasisCode?: string | null;
  hasVisibleViolation?: boolean;
  visibleViolationDescription?: string | null;
  additionalCollateralDescription?: string | null;
  branchName?: string | null;
  branchCode?: string | null;
  requestId?: number;
  creatorDepartmentId?: number | null;
}

// ─── Output DTO (Get/GetAll) ─────────────────────────────────────
export interface PropertyAppraisalOutputDto extends PropertyAppraisalInputDto {
  id: number;
  requestOutputDto?: any | null;
  propertyOccupier?: LookupValueDto | null;
  definitiveOwnershipDocumentType?: LookupValueDto | null;
  typeOfWorkCompletion?: LookupValueDto | null;
  typeOfEndowmentProperty?: LookupValueDto | null;
  evaluationTopic?: LookupValueDto | null;
  structureType?: LookupValueDto | null;
  inheritanceStatus?: LookupValueDto | null;
  urbanLocationGrade?: LookupValueDto | null;
  disasterVulnerability?: LookupValueDto | null;
  constructionQuality?: LookupValueDto | null;
  certificateType?: LookupValueDto | null;
  leaseType?: LookupValueDto | null;
  valuationPriceBasis?: LookupValueDto | null;
}

// ─── GetAll Params ───────────────────────────────────────────────
export interface GetAllPropertyAppraisalsParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
