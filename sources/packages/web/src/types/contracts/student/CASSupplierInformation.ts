import { SupplierStatus } from "@/services/http/dto/CASSupplier.dto";

/**
 * Student supplier information data from the integration with Corporate Accounting System (CAS).
 */
export interface CASSupplierInformation {
  dateCreated: Date;
  supplierNumber?: string;
  supplierProtected?: string;
  supplierStatus: SupplierStatus;
  isValid: boolean;
  supplierSiteCode?: string;
  addressLine1?: string;
  siteStatus?: "ACTIVE" | "INACTIVE";
  siteProtected?: string;
}
