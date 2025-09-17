import { BC_FUNDING_TYPES } from "@sims/services/constants";
import {
  DisbursementValue,
  OfferingIntensity,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  ApplicationActiveRestrictionBypass,
  EligibleECertDisbursement,
  StudentActiveRestriction,
} from "../disbursement-schedule.models";
import { RestrictionCode } from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { isRestrictionActionEffective } from "@sims/utilities";

/**
 * Check active student restrictions by its action type in an eligible disbursement.
 * An active bypassed restriction will not be included in the result.
 * @param eCertDisbursement student disbursement to check student restrictions.
 * @param actionType action type.
 * @returns the first restriction of the requested action type.
 */
export function getRestrictionByActionType(
  eCertDisbursement: EligibleECertDisbursement,
  actionType: RestrictionActionType,
): StudentActiveRestriction {
  return eCertDisbursement.getEffectiveRestrictions().find(
    (restriction) =>
      restriction.actions.includes(actionType) &&
      isRestrictionActionEffective(restriction.actionEffectiveConditions, {
        aviationCredentialType:
          eCertDisbursement.offering.aviationCredentialType,
      }),
  );
}

/**
 * Adds to the log the lists of all restriction bypasses active.
 * @param bypasses active bypasses.
 * @param log log to receive the list.
 */
export function logActiveRestrictionsBypasses(
  bypasses: ReadonlyArray<ApplicationActiveRestrictionBypass>,
  log: ProcessSummary,
): void {
  if (!bypasses.length) {
    log.info("There are no active restriction bypasses.");
    return;
  }
  const bypassLogInfo = bypasses.map(
    (bypass) => `${bypass.restrictionCode}(${bypass.studentRestrictionId})`,
  );
  log.info(
    `Current active restriction bypasses [Restriction Code(Student Restriction ID)]: ${bypassLogInfo.join(
      ", ",
    )}.`,
  );
}

/**
 * Check active student restrictions by its
 * restriction code in an eligible disbursement.
 * @param eCertDisbursement student disbursement to check student restrictions.
 * @param code restriction code.
 * @returns the first restriction of the requested code.
 */
export function getRestrictionByCode(
  eCertDisbursement: EligibleECertDisbursement,
  code: RestrictionCode,
): StudentActiveRestriction {
  return eCertDisbursement.activeRestrictions?.find(
    (restriction) => restriction.code === code,
  );
}

/**
 * Determine when BC funding should not be disbursed.
 * In this case the e-Cert can still be generated with the federal funding.
 * @param eCertDisbursement student disbursement that is part of one e-Cert.
 * @param disbursementValue award to be checked.
 * @returns true if the funding should not be disbursed, otherwise, false.
 */
export function shouldStopBCFunding(
  eCertDisbursement: EligibleECertDisbursement,
  disbursementValue: DisbursementValue,
): boolean {
  const restrictionType =
    eCertDisbursement.offering.offeringIntensity === OfferingIntensity.fullTime
      ? RestrictionActionType.StopFullTimeBCFunding
      : RestrictionActionType.StopPartTimeBCFunding;
  const stopFunding = getRestrictionByActionType(
    eCertDisbursement,
    restrictionType,
  );
  return stopFunding && BC_FUNDING_TYPES.includes(disbursementValue.valueType);
}
