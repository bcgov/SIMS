import { IsNotEmpty, MaxLength } from "class-validator";
import { NOTE_DESCRIPTION_MAX_LENGTH, OfferingIntensity } from "@sims/sims-db";

/**
 * MSFAA activity record details for a student as seen by Ministry users.
 */
export class MSFAANumberAPIOutDTO {
  /**
   * MSFAA id.
   */
  id: number;
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
  /**
   * Indicates if the MSFAA can be reissued, which happens when it is the most recent
   * MSFAA for its offering intensity, it is cancelled, and it has disbursements associated.
   */
  canBeReissued: boolean;
}

/**
 * Details to cancel an MSFAA.
 */
export class CancelMSFAAAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * Details to reissue an MSFAA.
 */
export class ReissueMSFAAAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}
