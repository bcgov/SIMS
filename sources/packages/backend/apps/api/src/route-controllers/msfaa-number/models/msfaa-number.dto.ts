import { OfferingIntensity } from "@sims/sims-db";

/**
 * MSFAA activity record details for a student as seen by Ministry users.
 */
export class MSFAANumberAPIOutDTO {
  /**
   * Date the MSFAA record was created.
   */
  createdAt: Date;
  /**
   * Offering intensity (full-time or part-time).
   */
  offeringIntensity: OfferingIntensity;
  /**
   * The MSFAA number.
   */
  msfaaNumber: string;
  /**
   * Date the MSFAA file was sent to ESDC (date requested), null if not yet sent.
   */
  dateSent?: Date;
  /**
   * Date the MSFAA was signed by the student, null if not yet signed.
   */
  dateSigned?: string;
  /**
   * Date the MSFAA was cancelled, null if not cancelled.
   */
  cancelledDate?: string;
  /**
   * Province which issued the cancellation (new_issuing_province), null if not cancelled.
   */
  newIssuingProvince?: string;
}
