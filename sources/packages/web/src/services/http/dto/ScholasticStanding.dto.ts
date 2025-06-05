import { ValidationResultAPIOutDTO } from "./Common.dto";
import { ActiveApplicationDataAPIOutDTO } from "./InstitutionLocation.dto";

export const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export const INVALID_OPERATION_IN_THE_CURRENT_STATUS =
  "INVALID_OPERATION_IN_THE_CURRENT_STATUS";
export const INVALID_UNSUCCESSFUL_COMPLETION_WEEKS =
  "INVALID_UNSUCCESSFUL_COMPLETION_WEEKS";

export interface ScholasticStandingDataAPIInDTO {
  scholasticStandingChangeType: string;
  dateOfChange?: string;
  booksAndSupplies?: number;
  dateOfCompletion?: string;
  exceptionalCosts?: number;
  mandatoryFees?: number;
  tuition?: number;
  isCostDifferent?: string;
  reasonOfIncompletion?: {
    grades?: boolean;
    attendance?: boolean;
    other?: boolean;
  };
  numberOfUnsuccessfulWeeks?: number;
  notes?: string;
  dateOfWithdrawal?: string;
}

/**
 * Represents the scholastic standing submitted details.
 */
export interface ScholasticStandingSubmittedDetailsAPIOutDTO
  extends ScholasticStandingDataAPIInDTO,
    ActiveApplicationDataAPIOutDTO {}

/**
 * Represents the scholastic standing summary details.
 */
export interface ScholasticStandingSummaryDetailsAPIOutDTO {
  fullTimeLifetimeUnsuccessfulCompletionWeeks: number;
  partTimeLifetimeUnsuccessfulCompletionWeeks: number;
}

/**
 * Represents the possible errors that can happen during the
 * application bulk withdrawal and provides a detailed description
 * for every record that has an error.
 */
export interface ApplicationBulkWithdrawalValidationResultAPIOutDTO {
  recordIndex: number;
  applicationNumber?: number;
  withdrawalDate?: string;
  errors: string[];
  infos: ValidationResultAPIOutDTO[];
  warnings: ValidationResultAPIOutDTO[];
}
