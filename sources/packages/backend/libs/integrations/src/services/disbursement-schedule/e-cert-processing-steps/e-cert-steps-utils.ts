import { BC_FUNDING_TYPES } from "@sims/services/constants";
import {
  DisbursementSchedule,
  DisbursementValue,
  OfferingIntensity,
  RestrictionActionType,
  StudentRestriction,
} from "@sims/sims-db";

/**
 * Check student restrictions by its action type.
 * @param studentRestrictions student restrictions.
 * @param actionType action type.
 * @returns the first restriction of the requested
 * action type.
 */
export function getStudentRestrictionByActionType(
  studentRestrictions: StudentRestriction[],
  actionType: RestrictionActionType,
) {
  return studentRestrictions?.find((studentRestriction) =>
    studentRestriction.restriction.actionType.includes(actionType),
  );
}

/**
 * Determine when a BC Full-time/Part-time funding should not be disbursed.
 * In this case the e-Cert can still be generated with th federal funding.
 * @param disbursement disbursement to be checked.
 * @param disbursementValue award to be checked.
 * @returns true if the funding should not be disbursed, otherwise, false.
 */
export function shouldStopFunding(
  disbursement: DisbursementSchedule,
  disbursementValue: DisbursementValue,
): boolean {
  const stopFunding = getStudentRestrictionByActionType(
    disbursement.studentAssessment.application.student.studentRestrictions,
    RestrictionActionType.StopFullTimeBCFunding,
  );
  return (
    stopFunding &&
    disbursement.studentAssessment.application.currentAssessment.offering
      .offeringIntensity === OfferingIntensity.fullTime &&
    BC_FUNDING_TYPES.includes(disbursementValue.valueType)
  );
}
