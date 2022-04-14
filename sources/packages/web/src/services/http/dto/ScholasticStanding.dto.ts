import { checkboxFormType } from "@/types";

export interface ScholasticStandingAPIInDTO {
  scholasticStanding: string;
  dateOfChange?: string;
  booksAndSupplies?: number;
  dateOfCompletion?: string;
  exceptionalCosts?: number;
  mandatoryFees?: number;
  tuition?: number;
  isCostDifferent?: checkboxFormType;
  reasonOfIncompletion?: {
    grades?: boolean;
    attendance?: boolean;
    other?: boolean;
  };
  dateOfIncompletion?: string;
  notes?: string;
  dateOfWithdrawal?: string;
}
