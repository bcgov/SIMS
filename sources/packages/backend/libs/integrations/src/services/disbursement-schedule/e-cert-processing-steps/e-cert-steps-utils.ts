import {
  DisbursementValueType,
  OfferingIntensity,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  ActiveRestriction,
  ApplicationActiveRestrictionBypass,
  EligibleECertDisbursement,
  StudentActiveRestriction,
} from "../disbursement-schedule.models";
import { RestrictionCode } from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { isRestrictionActionEffective } from "./e-cert-steps-restriction-utils";

/**
 * Map of restriction action types associated with the offering intensity.
 */
const RESTRICTION_ACTION_TYPE_INTENSITY_MAP = new Map([
  [
    OfferingIntensity.fullTime,
    [
      RestrictionActionType.StopFullTimeBCLoan,
      RestrictionActionType.StopFullTimeBCGrants,
    ],
  ],
  [OfferingIntensity.partTime, [RestrictionActionType.StopPartTimeBCGrants]],
]);

/**
 * List of restriction actions that block BC grants.
 */
const BC_GRANTS_RESTRICTION_ACTIONS = [
  RestrictionActionType.StopFullTimeBCGrants,
  RestrictionActionType.StopPartTimeBCGrants,
];

/**
 * Check active student restrictions by its action type in an eligible disbursement.
 * An active bypassed restriction or a restriction which does not satisfy its action effective conditions
 * will not be included in the result.
 * @param eCertDisbursement student disbursement to check student restrictions.
 * @param actionTypes action types.
 * @returns the all the effective restrictions of the requested action type.
 */
export function getRestrictionsByActionType(
  eCertDisbursement: EligibleECertDisbursement,
  actionTypes: RestrictionActionType[],
): ActiveRestriction[] {
  return eCertDisbursement
    .getEffectiveRestrictions()
    .filter(
      (restriction) =>
        actionTypes.some((actionType) =>
          restriction.actions.includes(actionType),
        ) &&
        isRestrictionActionEffective(
          restriction.actionEffectiveConditions,
          eCertDisbursement,
        ),
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
 * Inspects all the active restrictions in the e-Cert disbursement and builds a map
 * of disbursement value types that should not be disbursed due to an active restriction.
 * A student disbursement can have multiple active restrictions where many can block the same
 * funding type. In this case, all restrictions will be listed for the funding type.
 * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
 * @returns map of disbursement value types that should not be disbursed and the associated restrictions.
 */
export function getStopFundingTypesAndRestrictionsMap(
  eCertDisbursement: EligibleECertDisbursement,
): Map<DisbursementValueType, ActiveRestriction[]> {
  const restrictionTypes = RESTRICTION_ACTION_TYPE_INTENSITY_MAP.get(
    eCertDisbursement.offering.offeringIntensity,
  );
  // Find restrictions associated with the offering intensity.
  const stopFundingTypeRestrictions = getRestrictionsByActionType(
    eCertDisbursement,
    restrictionTypes,
  );
  const resultMap = new Map<DisbursementValueType, ActiveRestriction[]>();
  for (const restriction of stopFundingTypeRestrictions) {
    if (
      restriction.actions.includes(RestrictionActionType.StopFullTimeBCLoan)
    ) {
      resultMap.set(DisbursementValueType.BCLoan, [
        ...(resultMap.get(DisbursementValueType.BCLoan) || []),
        restriction,
      ]);
    }
    if (
      BC_GRANTS_RESTRICTION_ACTIONS.some((action) =>
        restriction.actions.includes(action),
      )
    ) {
      resultMap.set(DisbursementValueType.BCGrant, [
        ...(resultMap.get(DisbursementValueType.BCGrant) || []),
        restriction,
      ]);
    }
  }
  return resultMap;
}
