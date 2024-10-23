import { CASSupplierRecordStatus, CASSupplierSiteStatus } from "@sims/sims-db";
import * as dayjs from "dayjs";

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
 * Default amount of time to a token be expired and be
 * considered candidate to be renewed.
 */
const CAS_TOKEN_RENEWAL_SECONDS = 60;

/**
 * Cache the CAS token to be reused.
 */
export class CachedCASAuthDetails {
  private readonly renewalTime: Date;
  constructor(public readonly authDetails: CASAuthDetails) {
    this.renewalTime = dayjs()
      .add(authDetails.expires_in - CAS_TOKEN_RENEWAL_SECONDS, "seconds")
      .toDate();
  }

  /**
   * Indicates if the token requires renewal.
   * @returns true if must be renewed, otherwise false.
   */
  requiresRenewal(): boolean {
    return dayjs().isAfter(this.renewalTime);
  }
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
  SupplierName: string;
  SubCategory: string;
  Sin: string;
  SupplierAddress: [
    {
      AddressLine1: string;
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
