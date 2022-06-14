import { ActiveApplicationDataAPIOutDTO } from "./InstitutionLocation.dto";

export const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export const INVALID_OPERATION_IN_THE_CURRENT_STATUS =
  "INVALID_OPERATION_IN_THE_CURRENT_STATUS";

export interface ScholasticStandingDataAPIInDTO {
  scholasticStanding: string;
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

export interface ScholasticStandingSubmittedDetailsAPIOutDTO
  extends ScholasticStandingDataAPIInDTO,
    ActiveApplicationDataAPIOutDTO {}
