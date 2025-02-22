import { AddressAPIOutDTO } from "../../models/common.dto";
import { IsValidSIN } from "../../../utilities/class-validation";

/**
 * Student search application details.
 */
export class ApplicationDetailsAPIOutDTO {
  isLegacy: boolean;
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
}

/**
 * Student search result.
 */
export class StudentSearchResultAPIOutDTO {
  isLegacy: boolean;
  givenNames: string;
  lastName: string;
  sin: string;
  birthDate: string;
  phoneNumber: string;
  address: AddressAPIOutDTO;
  applications: ApplicationDetailsAPIOutDTO[];
}

/**
 * Student external search parameters.
 */
export class StudentSearchAPIInDTO {
  @IsValidSIN()
  sin: string;
}
