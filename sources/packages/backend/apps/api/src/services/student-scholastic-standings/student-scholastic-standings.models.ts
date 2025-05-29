import {
  OfferingIntensity,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";

export interface ScholasticStanding {
  dateOfChange?: string;
  booksAndSupplies?: number;
  dateOfCompletion?: string;
  exceptionalCosts?: number;
  mandatoryFees?: number;
  tuition?: number;
  numberOfUnsuccessfulWeeks?: number;
  dateOfWithdrawal?: string;
  scholasticStandingChangeType: StudentScholasticStandingChangeType;
}

/**
 * Represents the scholastic standing summary details.
 */
export interface ScholasticStandingSummary {
  totalUnsuccessfulWeeks: number;
  offeringIntensity: OfferingIntensity;
}
