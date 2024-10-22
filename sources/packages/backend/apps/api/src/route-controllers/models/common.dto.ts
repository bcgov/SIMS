import { COUNTRY_CANADA, OTHER_COUNTRY } from "@sims/utilities";
import { IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

/**
 * Common DTO for Address.
 ** This DTO is returned as API response body.
 */
export class AddressAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState?: string;
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
 * This is used by both dry run and non dry run controllers.
 */
export class AddressDetailsAPIInDTO {
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2?: string;
  @IsNotEmpty()
  city: string;
  // This property has the country irrespective of the selectedCountry and otherCountry,
  // so for API purpose take country from this property.
  @IsNotEmpty()
  country: string;
  // This property has the postalCode irrespective of the selectedCountry and otherCountry,
  // so for API purpose take postalCode from this property.
  @IsNotEmpty()
  postalCode: string;
  // provinceState will only have value when selectedCountry is 'canada'.
  @ValidateIf(
    (value: AddressDetailsAPIInDTO) => value.selectedCountry === COUNTRY_CANADA,
  )
  @IsNotEmpty()
  provinceState?: string;
  // This property will have canada postal code.
  // This property is for dry run validation, this is not saved in db.
  @ValidateIf(
    (value: AddressDetailsAPIInDTO) => value.selectedCountry === COUNTRY_CANADA,
  )
  @IsNotEmpty()
  canadaPostalCode?: string;
  // This property will have postal code for countries other than Canada.
  // This property is for dry run validation, this is not saved in db.
  @ValidateIf(
    (value: AddressDetailsAPIInDTO) => value.selectedCountry === OTHER_COUNTRY,
  )
  @IsNotEmpty()
  otherPostalCode?: string;
  // Dropdown value, it will have either "canada" or "other".
  // This property is for dry run validation, this is not saved in db.
  @IsNotEmpty()
  selectedCountry?: string;
  // When "other" is selected in selectedCountry, then this property will have a value.
  // This property is for dry run validation, this is not saved in db.
  @ValidateIf(
    (value: AddressDetailsAPIInDTO) => value.selectedCountry === OTHER_COUNTRY,
  )
  @IsNotEmpty()
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

/**
 * Common interface to be returned when an endpoint
 * processed a file uploaded from the form.io form.
 */
export class FileCreateAPIOutDTO {
  fileName: string;
  uniqueFileName: string;
  url: string;
  size: number;
  mimetype: string;
}
