import { AddressAPIOutDTO } from "../..";
import { IsValidSIN } from "../../../utilities/class-validation";

/**
 * Dependant details.
 */
class DependantDetailsAPIOutDTO {
  fullName: string;
  birthDate: string;
}

/**
 * Program offering details.
 */
class ProgramOfferingDetailsAPIOutDTO {
  lengthInWeeks: number;
  startDate: string;
  endDate: string;
  courseLoad: string;
}

/**
 * Institution details.
 */
class InstitutionDetailsAPIOutDTO {
  locationCode: string;
  locationName: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

/**
 * Assessed cost details.
 */
class AssessedCostDetailsAPIOutDTO {
  tuition: number;
  booksAndSupplies: number;
  exceptionalExpenses: number;
  livingAllowance: number;
  secondResidence: number;
  childCare: number;
  alimony: number;
  totalTransportation: number;
  totalNeed: number;
}

/**
 * Disbursement details.
 */
class DisbursementDetailsAPIOutDTO {
  awardCode: string;
  awardAmount: number;
  fundingDate: string;
  requestDate?: string;
}

/**
 * Student search application details.
 */
export class ApplicationDetailsAPIOutDTO {
  isLegacy: boolean;
  applicationNumber: string;
  applicationStatus: string;
  cancelDate?: string;
  withdrawalDate?: string;
  withdrawalReason?: string;
  // TODO: To be implemented in SIMS.
  withdrawalActiveFlag?: string;
  immigrationStatus: string;
  bcResidency: string;
  maritalStatus: string;
  // This field is only available for legacy students.
  marriageDate?: string;
  income: number;
  livingArrangement: "Home" | "Away";
  estimatedTotalAward: number;
  dependants?: DependantDetailsAPIOutDTO[];
  program: ProgramOfferingDetailsAPIOutDTO;
  institution: InstitutionDetailsAPIOutDTO;
  costs: AssessedCostDetailsAPIOutDTO;
  disbursements: DisbursementDetailsAPIOutDTO[];
}

/**
 * Student search result.
 */
export class StudentSearchResultAPIOutDTO {
  isLegacy: boolean;
  givenNames?: string;
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
