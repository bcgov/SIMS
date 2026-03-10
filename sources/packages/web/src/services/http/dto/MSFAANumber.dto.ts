import { OfferingIntensity } from "@/types";

/**
 * MSFAA activity record for a student as seen by Ministry users.
 */
export interface MSFAANumberAPIOutDTO {
  createdAt: Date;
  offeringIntensity: OfferingIntensity;
  msfaaNumber: string;
  dateSent?: Date;
  dateSigned?: string;
  cancelledDate?: string;
  newIssuingProvince?: string;
}
