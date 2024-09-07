export class CASSupplierInfoAPIOutDTO {
  items: CASSupplierInfoItemAPIOutDTO[];
}

export class CASSupplierInfoItemAPIOutDTO {
  dateCreated: Date;
  supplierNumber?: string;
  supplierProtected?: boolean;
  supplierStatus: SupplierStatus;
  isValid: boolean;
  supplierSiteCode?: string;
  addressLine1?: string;
  siteStatus?: CASSupplierSiteStatus;
  siteProtected?: string;
}

export type CASSupplierSiteStatus = "ACTIVE" | "INACTIVE";
export interface AddCASSupplierAPIInDTO {
  supplierNumber: string;
  supplierSiteCode: string;
}

/**
 * Indicates if the system should execute verification in the record calling some of the CAS integrations;
 * if the record represents manual entry and no actions are needed; or if no further verifications are needed.
 */
export enum SupplierStatus {
  /**
   * Pending supplier verification.
   */
  PendingSupplierVerification = "Pending supplier verification",
  /**
   * Pending address verification.
   */
  PendingAddressVerification = "Pending address verification",
  /**
   * Verified.
   */
  Verified = "Verified",
  /**
   * Verified manually.
   */
  VerifiedManually = "Verified manually",
}
