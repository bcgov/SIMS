import { CASSupplierSiteStatus, SupplierStatus } from "@sims/sims-db";
import { IsNotEmpty, IsNumberString, MaxLength } from "class-validator";

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

export class AddCASSupplierAPIInDTO {
  @IsNotEmpty()
  @MaxLength(30)
  @IsNumberString(
    { no_symbols: true },
    {
      message: "supplierNumber must contain only digits.",
    },
  )
  supplierNumber: string;
  @IsNotEmpty()
  @MaxLength(3)
  @IsNumberString(
    { no_symbols: true },
    {
      message: "supplierSiteCode must contain only digits.",
    },
  )
  supplierSiteCode: string;
}
