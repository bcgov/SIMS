import { StudentPDStatus } from "../types/pdStatus";
import { Student } from "@sims/sims-db";

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
 * Util to return the concatenated firstname and lastname ILIKE operator search criteria.
 * @param userTableAlias refers to the user table name.
 * @param searchCriteriaParameterName refers to the name of the searchCriteria.
 * @returns concatenated firstname and lastname ILIKE operator search criteria.
 */
export function getUserFullNameLikeSearch(
  userTableAlias = "user",
  searchCriteriaParameterName = "searchCriteria",
) {
  return `(${userTableAlias}.firstName || ' ' || ${userTableAlias}.lastName) ILIKE :${searchCriteriaParameterName}`;
}
