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
 * Invoice payload used during the creation of a pending invoice sent to CAS
 */
export class PendingInvoicePayload {
  invoiceType: string; // Using constant
  supplierNumber: string; // Retrieved from cas_supplier_id
  supplierSiteNumber: string; // Retrieved from cas_supplier_id
  invoiceDate: string; // Batch creation date or approval date
  invoiceNumber: string; // Supplier number concatenated with record id
  invoiceAmount: number; // Using constant
  payGroup: string; // Using constant
  dateInvoiceReceived: string; // Disbursement receipt file date
  dateGoodsReceived?: string; // Optional, not provided
  remittanceCode: string; // Using constant
  specialHandling: string; // Using constant
  nameLine1?: string; // Optional, not provided
  nameLine2?: string; // Optional, not provided
  addressLine1?: string; // Optional, not provided
  addressLine2?: string; // Optional, not provided
  addressLine3?: string; // Optional, not provided
  city?: string; // Optional, not provided
  country?: string; // Optional, not provided
  province?: string; // Optional, not provided
  postalCode?: string; // Optional, not provided
  qualifiedReceiver?: string; // Optional, not provided
  terms: string; // Using constant
  payAloneFlag?: string; // Optional, not provided
  paymentAdviceComments?: string; // Optional, not provided
  remittanceMessage1: string; // Using constant
  remittanceMessage2: string; // Using constant
  remittanceMessage3?: string; // Optional, not provided
  glDate: string; // Batch creation date
  invoiceBatchName: string; // SIMSBATCH + sequence number
  currencyCode: string; // Using constant
  invoiceLineDetails: InvoiceLineDetail[]; // Array of InvoiceLineDetail objects
}

/**
 * Invoice line detail used during the creation of a pending invoice sent to CAS
 */
export class InvoiceLineDetail {
  invoiceLineNumber: number; // Mandatory, incremental number
  invoiceLineType: string; // Using constant
  lineCode: string; // DR or CR
  invoiceLineAmount: number; // Award(grant) value
  defaultDistributionAccount: string; // Specific for an award(grant) plus operation type
  description?: string; // Optional, not provided
  taxClassificationCode?: string; // Optional, not provided
  distributionSupplier?: string; // Optional, not provided
  info1?: string; // Optional, not provided
  info2?: string; // Optional, not provided
  info3?: string; // Optional, not provided
}

/**
 * Response from CAS when sending pending invoices.
 */
export class SendPendingInvoicesResponse {
  invoice_number?: string;
  CAS_RETURNED_MESSAGES: string | string[];
}
