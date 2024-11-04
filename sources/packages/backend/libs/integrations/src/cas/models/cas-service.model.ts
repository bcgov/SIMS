import { CASSupplierRecordStatus, CASSupplierSiteStatus } from "@sims/sims-db";

export class CASSupplierResponse {
  items: CASSupplierResponseItem[];
  hasMore: boolean;
  limit: number;
  offset: number;
  count: number;
}

export class CASSupplierResponseItem {
  suppliernumber: string;
  suppliername: string;
  subcategory: string;
  sin: string;
  providerid?: string;
  businessnumber?: null;
  status: CASSupplierRecordStatus;
  supplierprotected?: "Y" | "N" | null;
  standardindustryclassification?: string;
  lastupdated: string;
  supplieraddress: CASSupplierResponseItemAddress[];
}

export class CASSupplierResponseItemAddress {
  suppliersitecode: string;
  addressline1: string;
  addressline2?: string;
  addressline3?: string;
  city: string;
  province: string;
  country: string;
  postalcode: string;
  emailaddress?: string;
  accountnumber?: string;
  branchnumber?: string;
  banknumber?: string;
  eftadvicepref?: string;
  providerid?: string;
  status: CASSupplierSiteStatus;
  siteprotected?: string;
  lastupdated: string;
}

export class CASAuthDetails {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Information needed for supplier and site creation on CAS.
 */
export class CreateSupplierAndSiteData {
  firstName: string;
  lastName: string;
  sin: string;
  emailAddress: string;
  supplierSite: CreateSupplierSite;
}

/**
 * Information needed for existing supplier site creation on CAS.
 */
export class CreateExistingSupplierSiteData {
  supplierNumber: string;
  supplierSite: CreateSupplierSite;
  emailAddress: string;
}

/**
 * Site information needed for supplier and site creation on CAS.
 */
export class CreateSupplierSite {
  addressLine1: string;
  city: string;
  provinceCode: string;
  postalCode: string;
}

/**
 * Result from a supplier and site creation.
 */
export class CreateSupplierAndSiteResult {
  supplierNumber: string;
  supplierSiteCode: string;
}

/**
 * Data used during the creation of a supplier and site on CAS.
 * Some data transformation is needed to follow the CAS requirements.
 * This payload is used to submit the data and also to be returned to
 * the consumer, allowing it to be aware of the data actually submitted.
 */
export class CreateSupplierAndSiteSubmittedData {
  SupplierName?: string;
  SubCategory?: string;
  SupplierNumber?: string;
  Sin?: string;
  SupplierAddress: [
    {
      AddressLine1: string;
      AddressLine2?: string;
      AddressLine3?: string;
      City: string;
      Province: string;
      Country: string;
      PostalCode: string;
      EmailAddress: string;
    },
  ];
}

/**
 * Combination of the CAS supplier and site creation
 * submitted data and its API response.
 */
export class CreateSupplierAndSiteResponse {
  submittedData: CreateSupplierAndSiteSubmittedData;
  response: CreateSupplierAndSiteResult;
}
