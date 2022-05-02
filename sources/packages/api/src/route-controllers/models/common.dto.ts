import { Allow, IsNotEmpty, IsOptional } from "class-validator";

/**
 * TODO: Address DTOs have been with 2 different names as the
 * TODO: property province is used as provinceState in some places in code.
 **/
/**
 * Common DTO for Address
 ** This DTO is used in API request body.
 */
export class AddressAPIInDTO {
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2: string;
  @IsNotEmpty()
  city: string;
  @IsOptional()
  provinceState?: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  postalCode: string;
  @IsOptional()
  selectedCountry?: string;
}

/**
 * Common DTO for Address
 ** This DTO is used in API request body.
 */
export class AddressInfoAPIInDTO {
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  province: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  postalCode: string;
}

/**
 * Common DTO for Address.
 ** This DTO is returned as API response body.
 */
export class AddressAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

/**
 * Common DTO for Address.
 ** This DTO is returned as API response body.
 */
export class AddressInfoAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province?: string;
  country: string;
  postalCode: string;
}

/**
 * Common DTO returned by data lookup APIs.
 ** Data lookup APIs are used to populate values in form.
 */
export class OptionItemAPIOutDTO {
  id: number;
  description: string;
}

/**
 * Allow extending the object properties dynamically
 * while keeping the type.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class DynamicAPIOutDTO<T> {
  [k: string]: T;
}

/**
 * Payload/Input DTO for address details.
 */
export class AddressDetailsAPIInDTO {
  @Allow()
  addressLine1: string;
  @Allow()
  addressLine2?: string;
  @Allow()
  city: string;
  // This property has the country irrespective of the selectedCountry and otherCountry,
  // so for API purpose take country from this property.
  @Allow()
  country: string;
  // This property has the postalCode irrespective of the selectedCountry and otherCountry,
  // so for API purpose take postalCode from this property.
  @Allow()
  postalCode: string;
  @Allow()
  provinceState?: string;
  // This property will have canada postal code.
  // This property is for dry run validation, this is not saved in db.
  @IsOptional()
  canadaPostalCode?: string;
  // This property will have postal code for countries other than Canada.
  // This property is for dry run validation, this is not saved in db.
  @IsOptional()
  otherPostalCode?: string;
  // Dropdown value, it will have either "canada" or "other".
  // This property is for dry run validation, this is not saved in db.
  @IsOptional()
  selectedCountry?: string;
  // When "other" is selected in selectedCountry, then this property will have a value.
  // This property is for dry run validation, this is not saved in db.
  @IsOptional()
  otherCountry?: string;
}

/**
 * Response/Output DTO for address details.
 */
export class AddressDetailsAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode: string;
  provinceState?: string;
  canadaPostalCode?: string;
  otherPostalCode?: string;
  selectedCountry?: string;
  otherCountry?: string;
}
