import { Application, DisbursementSchedule } from "../database/entities";
import { COE_DENIED_REASON_OTHER_ID, PIR_DENIED_REASON_OTHER_ID } from ".";
export const PIR_OR_DATE_OVERLAP_ERROR = "PIR_OR_DATE_OVERLAP_ERROR";
export const PIR_OR_DATE_OVERLAP_ERROR_MESSAGE =
  "There is an existing application already with overlapping study period or a pending PIR.";
/**
 * Gets PIR denied reason
 * @param application application Object.
 * @returns PIR denied reason.
 */
export function getPIRDeniedReason(application: Application): string {
  return application.pirDeniedReasonId?.id === PIR_DENIED_REASON_OTHER_ID
    ? application.pirDeniedOtherDesc
    : application.pirDeniedReasonId?.reason;
}

/**
 * Gets COE denied reason
 * @param disbursementSchedule application Object.
 * @returns COE denied reason.
 */
export function getCOEDeniedReason(
  disbursementSchedule: DisbursementSchedule,
): string {
  return disbursementSchedule.coeDeniedReason?.id === COE_DENIED_REASON_OTHER_ID
    ? disbursementSchedule.coeDeniedOtherDesc
    : disbursementSchedule.coeDeniedReason?.reason;
}
