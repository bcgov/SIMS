import { checkboxFormioType } from "@/types";

export const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export const NOT_A_COMPLETED_APPLICATION = "NOT_A_COMPLETED_APPLICATION";
export const ANOTHER_ASSESSMENT_INPROGRESS = "ANOTHER_ASSESSMENT_INPROGRESS";

export interface ScholasticStandingAPIInDTO {
  scholasticStanding: string;
  dateOfChange?: string;
  booksAndSupplies?: number;
  dateOfCompletion?: string;
  exceptionalCosts?: number;
  mandatoryFees?: number;
  tuition?: number;
  isCostDifferent?: checkboxFormioType;
  reasonOfIncompletion?: {
    grades?: boolean;
    attendance?: boolean;
    other?: boolean;
  };
  dateOfIncompletion?: string;
  notes?: string;
  dateOfWithdrawal?: string;
}
