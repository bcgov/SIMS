import { OfferingIntensity } from "@sims/sims-db";

/**
 * MSFAA record that can be reissued.
 */
export interface MSFAAEligibleForReissue {
  /**
   * MSFAA id.
   */
  id: number;
  /**
   * Offering intensity of the MSFAA.
   */
  offeringIntensity: OfferingIntensity;
  /**
   * Application to be used as the reference for the new MSFAA.
   */
  referenceApplicationId: number;
}
