import { IsNotEmpty, IsOptional } from "class-validator";

/**
 * TODO: Address DTOs have been with 2 different names as the
 * TODO: property province is used as provinceState in some places in code.
 **/
/**
 * Common DTO for Address
 ** This DTO is used in API request body.
 */
export class AddressInDTO {
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  provinceState: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  postalCode: string;
}

/**
 * Common DTO for Address
 ** This DTO is used in API request body.
 */
export class AddressInfoInDTO {
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
export class AddressOutDTO {
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
export class AddressInfoOutDTO {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
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
