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
  status: "ACTIVE" | "INACTIVE";
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
  status: "ACTIVE" | "INACTIVE";
  siteprotected?: string;
  lastupdated: string;
}

export class CASAuthDetails {
  access_token: string;
  token_type: string;
  expires_in: number;
}
