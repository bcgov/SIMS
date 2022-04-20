import { IsNotEmpty, IsOptional } from "class-validator";

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
export class AddressInfoAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
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
