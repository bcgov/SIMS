import { CASSupplierSiteStatus, SupplierStatus } from "@sims/sims-db";
import { IsNumberString, MaxLength, MinLength } from "class-validator";

export class CASSupplierInfoAPIOutDTO {
  items: CASSupplierInfoItemAPIOutDTO[];
}

export class CASSupplierInfoItemAPIOutDTO {
  id: number;
  dateCreated: Date;
  supplierNumber?: string;
  supplierProtected?: boolean;
  supplierStatus: SupplierStatus;
  isValid: boolean;
  supplierSiteCode?: string;
  addressLine1?: string;
  siteStatus?: CASSupplierSiteStatus;
  siteProtected?: string;
  errors?: string[];
}

export class AddCASSupplierAPIInDTO {
  @MaxLength(30)
  @MinLength(6)
  @IsNumberString({ no_symbols: true })
  supplierNumber: string;
  @MaxLength(3)
  @MinLength(3)
  @IsNumberString({ no_symbols: true })
  supplierSiteCode: string;
}
