import { StudentPDStatus } from "src/types";
import { Student } from "src/database/entities";

/**
 * Determines the permanent disablility status from Student Entity.
 * @param student
 * @returns PDStatus enum
 */
export const determinePDStatus = (student: Student): StudentPDStatus => {
  if (student.studentPDVerified) {
    return StudentPDStatus.Yes;
  } else if (student.studentPDSentAt) {
    return student.studentPDUpdateAt
      ? StudentPDStatus.No
      : StudentPDStatus.Pending;
  }
  return StudentPDStatus.Not_Requested;
};
