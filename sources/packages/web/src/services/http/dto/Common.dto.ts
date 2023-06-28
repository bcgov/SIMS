import { Expose } from "class-transformer";

export interface OptionItemAPIOutDTO {
  id: number;
  description: string;
}

export interface InstitutionPrimaryContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
}

/**
 * Common DTO for address details.
 * IN/OUT is not specified for this DTO, because it is
 * a generic address interface that is used extend or used as nested type
 * for both IN and OUT DTOs
 */
export class AddressDetailsFormAPIDTO {
  @Expose()
  addressLine1: string;
  @Expose()
  addressLine2?: string;
  @Expose()
  city: string;
  @Expose()
  country: string;
  @Expose()
  postalCode: string;
  @Expose()
  provinceState?: string;
  @Expose()
  canadaPostalCode?: string;
  @Expose()
  otherPostalCode?: string;
  @Expose()
  selectedCountry?: string;
  @Expose()
  otherCountry?: string;
}

/**
 * Common interface to be returned when an endpoint
 * processed a file uploaded from the form.io form.
 */
export interface FileCreateAPIOutDTO {
  fileName: string;
  uniqueFileName: string;
  url: string;
  size: number;
  mimetype: string;
}

/**
 * Common primary identifier for all the DTO.
 */
export interface PrimaryIdentifierAPIOutDTO {
  id: number;
}
