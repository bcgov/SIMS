/**
 * MSFAA record that can be reissued.
 */
export interface MSFAAEligibleForReissue {
  /**
   * MSFAA id.
   */
  id: number;
  /**
   * Application to be used as the reference for the new MSFAA.
   */
  referenceApplicationId: number;
}
