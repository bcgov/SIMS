import { StudentPDStatus } from "../types/pdStatus";
import { OfferingIntensity, Student } from "../database/entities";

/**
 * Determines the permanent disability status from Student Entity.
 * @param student
 * @returns PDStatus enum
 */
export const determinePDStatus = (student: Student): StudentPDStatus => {
  if (student.studentPDVerified) {
    return StudentPDStatus.Yes;
  }
  if (student.studentPDVerified === false) {
    return StudentPDStatus.No;
  }
  if (student.studentPDSentAt) {
    return StudentPDStatus.Pending;
  }
  return StudentPDStatus.NotRequested;
};

export const deliveryMethod = (
  deliveredOnline: boolean,
  deliveredOnSite: boolean,
): string => {
  if (deliveredOnline && deliveredOnSite) {
    return "Blended";
  }
  if (deliveredOnSite) {
    return "Onsite";
  }
  return "Online";
};

/**
 * Gets the offering intensity from code
 */
export function getOfferingIntensity(
  offeringIntensityCode: string,
): OfferingIntensity {
  return offeringIntensityCode === "FT"
    ? OfferingIntensity.fullTime
    : OfferingIntensity.partTime;
}
