import { CASSupplierSiteStatus, SupplierStatus } from "@sims/sims-db";

export class CASSupplierInfoAPIOutDTO {
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

export interface AddCASSupplierAPIInDTO {
  supplierNumber: string;
  supplierSiteCode: string;
}
