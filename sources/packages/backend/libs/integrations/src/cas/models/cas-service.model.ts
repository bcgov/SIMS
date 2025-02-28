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
 * Supplier address data used during the creation of a supplier and site on CAS.
 */
export class CreateSupplierAddressSubmittedData {
  AddressLine1: string;
  City: string;
  Province: string;
  Country: string;
  PostalCode: string;
  EmailAddress: string;
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
  SupplierAddress: CreateSupplierAddressSubmittedData[];
}

/**
 * Data used during the creation of a supplier and site on CAS for existing suppliers.
 */
export class CreateExistingSupplierAndSiteSubmittedData {
  SupplierName?: string;
  SupplierNumber: string;
  SupplierAddress: CreateSupplierAddressSubmittedData[];
}

/**
 * Combination of the CAS supplier and site creation
 * submitted data and its API response.
 */
export class CreateSupplierAndSiteResponse {
  submittedData: CreateSupplierAndSiteSubmittedData;
  response: CreateSupplierAndSiteResult;
}

/**
 * Combination of the existing CAS supplier site creation
 * submitted data and its API response.
 */
export class CreateExistingSupplierSiteResponse {
  submittedData: CreateExistingSupplierAndSiteSubmittedData;
  response: CreateSupplierAndSiteResult;
}

/**
 * Invoice payload used during the creation of a pending invoice sent to CAS.
 */
export class PendingInvoicePayload {
  invoiceType: string;
  supplierNumber: string;
  supplierSiteNumber: string;
  invoiceDate: string;
  invoiceNumber: string;
  invoiceAmount: number;
  payGroup: string;
  dateInvoiceReceived: string;
  remittanceCode: string;
  specialHandling: string;
  terms: string;
  remittanceMessage1: string;
  remittanceMessage2: string;
  glDate: string;
  invoiceBatchName: string;
  currencyCode: string;
  invoiceLineDetails: InvoiceLineDetail[];
}

/**
 * Invoice line detail used during the creation of a pending invoice sent to CAS.
 */
export class InvoiceLineDetail {
  invoiceLineNumber: number;
  invoiceLineType: string;
  lineCode: string;
  invoiceLineAmount: number;
  defaultDistributionAccount: string;
}

/**
 * Response from CAS when sending invoices.
 */
export class SendInvoicesResponse {
  invoiceNumber?: string;
  casReturnedMessages?: string[];
}
