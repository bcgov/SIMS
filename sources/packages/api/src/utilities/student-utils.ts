import { StudentPDStatus } from "../types/pdStatus";
import { Student } from "../database/entities";

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
  } else if (deliveredOnSite) {
    return "Onsite";
  } else {
    return "Online";
  }
};
