export interface Institute {
  name: string;
  code?: string;
}

/**
 * Interface for Institution search API response
 */
export interface SearchInstitutionResp {
  id: number;
  legalName: string;
  operatingName: string;
  address: string;
}
