import { BC_FUNDING_TYPES } from "@sims/services/constants";
import {
  DisbursementSchedule,
  DisbursementValue,
  OfferingIntensity,
  RestrictionActionType,
  StudentRestriction,
} from "@sims/sims-db";

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
 * @param schedule disbursement to be checked.
 * @param disbursementValue award to be checked.
 * @returns true if the funding should not be disbursed, otherwise, false.
 */
export function shouldStopFunding(
  schedule: DisbursementSchedule,
  disbursementValue: DisbursementValue,
): boolean {
  const stopFunding = getStudentRestrictionByActionType(
    schedule.studentAssessment.application.student.studentRestrictions,
    RestrictionActionType.StopFullTimeBCFunding,
  );
  return (
    stopFunding &&
    schedule.studentAssessment.application.currentAssessment.offering
      .offeringIntensity === OfferingIntensity.fullTime &&
    BC_FUNDING_TYPES.includes(disbursementValue.valueType)
  );
}
