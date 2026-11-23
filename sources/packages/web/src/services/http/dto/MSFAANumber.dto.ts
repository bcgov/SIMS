import { OfferingIntensity } from "@/types";

/**
 * MSFAA activity record for a student as seen by Ministry users.
 */
export interface MSFAANumberAPIOutDTO {
  id: number;
  createdAt: Date;
  offeringIntensity: OfferingIntensity;
  msfaaNumber: string;
  dateSent?: Date;
  dateSigned?: string;
  cancelledDate?: string;
  newIssuingProvince?: string;
  canBeReissued: boolean;
}

/**
 * Details to cancel an MSFAA.
 */
export interface CancelMSFAAAPIInDTO {
  noteDescription: string;
}

/**
 * Details to reissue an MSFAA.
 */
export interface ReissueMSFAAAPIInDTO {
  noteDescription: string;
}
