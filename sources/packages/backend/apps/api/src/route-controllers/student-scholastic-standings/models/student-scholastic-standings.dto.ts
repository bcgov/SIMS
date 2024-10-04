import { IntersectionType } from "@nestjs/swagger";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { IsNotEmptyObject } from "class-validator";
import { ActiveApplicationDataAPIOutDTO } from "../../../route-controllers/institution-locations/models/application.dto";
import { JSON_10KB } from "../../../constants";
import { StudentScholasticStandingChangeType } from "@sims/sims-db";

/**
 * The API will also allow other properties that are not added below.
 */
export class ScholasticStandingData {
  dateOfChange?: string;
  booksAndSupplies?: number;
  dateOfCompletion?: string;
  exceptionalCosts?: number;
  mandatoryFees?: number;
  tuition?: number;
  numberOfUnsuccessfulWeeks?: number;
  dateOfWithdrawal?: string;
  scholasticStandingChangeType: StudentScholasticStandingChangeType;
  applicationOfferingEndDate: string;
  applicationOfferingStartDate: string;
}

/**
 * Dynamic data received for a scholastic standing change. The data is only partially
 * dynamic, few fields are saved to specific columns and the payload is also
 * entirely persisted, which means that the form can be expanded.
 */
export class ScholasticStandingAPIInDTO {
  @IsNotEmptyObject()
  @JsonMaxSize(JSON_10KB)
  data: ScholasticStandingData;
}

/**
 * Represents the scholastic standing submitted details.
 */
export class ScholasticStandingSubmittedDetailsAPIOutDTO extends IntersectionType(
  ScholasticStandingData,
  ActiveApplicationDataAPIOutDTO,
) {}

/**
 * Represents the scholastic standing unsuccessful completion weeks.
 */
export class ScholasticStandingSummaryDetailsAPIOutDTO {
  lifetimeUnsuccessfulCompletionWeeks: number;
}

/**
 * Represents the possible errors that can happen during the
 * application bulk withdrawal and provides a detailed description
 * for every record that has an error.
 */
export interface ApplicationBulkWithdrawalValidationResultAPIOutDTO {
  recordIndex?: number;
  applicationNumber?: string;
  withdrawalDate?: Date;
  errors: string[];
  infos: ValidationResultAPIOutDTO[];
  warnings: ValidationResultAPIOutDTO[];
}

/**
 * Represents an error considered not critical
 * for application withdrawal
 * and provides an user-friendly message
 * and a type that uniquely identifies this warning
 * or info.
 */
class ValidationResultAPIOutDTO {
  typeCode: string;
  message: string;
}
