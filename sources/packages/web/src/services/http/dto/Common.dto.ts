export interface OptionItemAPIOutDTO {
  id: number;
  description: string;
}

/**
 * TODO: Address DTOs have been with 2 different names as the
 * TODO: property province is used as provinceState in some places in code.
 **/
/**
 * Common DTO for Address
 ** This DTO is used in API request body.
 */
export interface AddressAPIInDTO {
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

/**
 * Common DTO for Address
 ** This DTO is used in API request body.
 */
export interface AddressInfoAPIInDTO {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

/**
 * Common DTO for Address.
 ** This DTO is returned as API response body.
 */
export interface AddressAPIOutDTO {
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

/**
 * Common DTO for Address.
 ** This DTO is returned as API response body.
 */
export interface AddressInfoAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

export interface InstitutionPrimaryContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
}
